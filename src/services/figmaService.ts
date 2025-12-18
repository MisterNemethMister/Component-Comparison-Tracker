import { Component, ComponentVariant } from '../types/component';

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  componentPropertyDefinitions?: Record<string, any>;
  description?: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  document: FigmaNode;
  components: Record<string, {
    key: string;
    name: string;
    description: string;
  }>;
}

class FigmaService {
  private apiToken: string | null = null;
  private baseUrl = 'https://api.figma.com/v1';

  setApiToken(token: string) {
    this.apiToken = token;
    localStorage.setItem('figma_api_token', token);
  }

  getApiToken(): string | null {
    if (!this.apiToken) {
      this.apiToken = localStorage.getItem('figma_api_token');
    }
    return this.apiToken;
  }

  extractFileKeyFromUrl(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async fetchFigmaFile(fileKey: string): Promise<FigmaFile> {
    const token = this.getApiToken();
    if (!token) {
      throw new Error('Figma API token not set. Please configure your token in settings.');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': token,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Invalid Figma API token or no access to this file');
      }
      throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchComponentImages(fileKey: string, nodeIds: string[]): Promise<Record<string, string>> {
    const token = this.getApiToken();
    if (!token || nodeIds.length === 0) {
      return {};
    }

    const idsParam = nodeIds.join(',');
    const response = await fetch(
      `${this.baseUrl}/images/${fileKey}?ids=${idsParam}&format=png&scale=2`,
      {
        headers: {
          'X-Figma-Token': token,
        },
      }
    );

    if (!response.ok) {
      console.warn('Failed to fetch component images:', response.statusText);
      return {};
    }

    const data = await response.json();
    return data.images || {};
  }

  findComponentNodes(node: FigmaNode, components: FigmaNode[] = []): FigmaNode[] {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      components.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        this.findComponentNodes(child, components);
      }
    }

    return components;
  }

  categorizeComponent(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('button')) return 'Button';
    if (lowerName.includes('input') || lowerName.includes('field')) return 'Input';
    if (lowerName.includes('card')) return 'Card';
    if (lowerName.includes('modal') || lowerName.includes('dialog')) return 'Modal';
    if (lowerName.includes('nav') || lowerName.includes('menu')) return 'Navigation';
    if (lowerName.includes('table')) return 'Table';
    if (lowerName.includes('form')) return 'Form';
    if (lowerName.includes('icon')) return 'Icon';
    if (lowerName.includes('badge') || lowerName.includes('chip')) return 'Badge';
    if (lowerName.includes('alert') || lowerName.includes('toast')) return 'Alert';
    
    return 'Other';
  }

  extractTags(node: FigmaNode): string[] {
    const tags: string[] = [];
    const name = node.name.toLowerCase();

    if (name.includes('primary')) tags.push('primary');
    if (name.includes('secondary')) tags.push('secondary');
    if (name.includes('disabled')) tags.push('disabled');
    if (name.includes('active')) tags.push('active');
    if (name.includes('hover')) tags.push('hover');
    if (name.includes('mobile')) tags.push('mobile');
    if (name.includes('desktop')) tags.push('desktop');
    if (name.includes('dark')) tags.push('dark-mode');
    if (name.includes('light')) tags.push('light-mode');

    return tags;
  }

  async parseLocalFigmaFile(file: File): Promise<FigmaFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Check if it's a binary file (Figma's native .fig format)
          if (content.charCodeAt(0) === 0 || content.includes('\x00') || !content.trim().startsWith('{')) {
            reject(new Error(
              'Native .fig files use a proprietary binary format that cannot be parsed in the browser.\n\n' +
              'Please use one of these alternatives:\n' +
              '1. Use the Figma URL option with your Figma API token\n' +
              '2. Export your Figma file as JSON from Figma (File > Export)\n' +
              '3. Use the Component Library URL option if your components are published'
            ));
            return;
          }
          
          const figmaData = JSON.parse(content);
          
          // Validate basic structure
          if (!figmaData.document) {
            throw new Error('Invalid Figma file format: missing document');
          }
          
          resolve(figmaData as FigmaFile);
        } catch (error) {
          if (error instanceof Error && error.message.includes('proprietary binary format')) {
            reject(error);
          } else {
            reject(new Error(
              'Failed to parse file. This may not be a valid Figma JSON export.\n\n' +
              'If you have a native .fig file, please use the Figma URL option instead with your API token.'
            ));
          }
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  async convertLocalFigmaToComponents(
    file: File,
    repositoryId: string
  ): Promise<Component[]> {
    const figmaFile = await this.parseLocalFigmaFile(file);
    const componentNodes = this.findComponentNodes(figmaFile.document);

    const componentsMap = new Map<string, Component>();

    for (const node of componentNodes) {
      const baseName = node.name.split('/')[0].trim();
      const variantName = node.name.includes('/') 
        ? node.name.split('/').slice(1).join('/').trim()
        : 'Default';

      const variant: ComponentVariant = {
        id: node.id,
        name: variantName,
        description: node.description || '',
        props: node.componentPropertyDefinitions || {},
        lastUpdated: figmaFile.lastModified || new Date().toISOString(),
      };

      if (componentsMap.has(baseName)) {
        const existingComponent = componentsMap.get(baseName)!;
        existingComponent.variants.push(variant);
        existingComponent.lastUpdated = figmaFile.lastModified || new Date().toISOString();
      } else {
        const component: Component = {
          id: `${repositoryId}:${node.id}`,
          repositoryId,
          name: baseName,
          description: node.description || `Figma component: ${baseName}`,
          variants: [variant],
          category: this.categorizeComponent(baseName),
          tags: this.extractTags(node),
          documentation: node.description,
          lastUpdated: figmaFile.lastModified || new Date().toISOString(),
        };
        componentsMap.set(baseName, component);
      }
    }

    return Array.from(componentsMap.values());
  }

  async convertFigmaToComponents(
    fileKey: string,
    repositoryId: string
  ): Promise<Component[]> {
    const figmaFile = await this.fetchFigmaFile(fileKey);
    const componentNodes = this.findComponentNodes(figmaFile.document);

    const nodeIds = componentNodes.map(node => node.id);
    const images = await this.fetchComponentImages(fileKey, nodeIds);

    const componentsMap = new Map<string, Component>();

    for (const node of componentNodes) {
      const baseName = node.name.split('/')[0].trim();
      const variantName = node.name.includes('/') 
        ? node.name.split('/').slice(1).join('/').trim()
        : 'Default';

      const variant: ComponentVariant = {
        id: node.id,
        name: variantName,
        description: node.description || '',
        props: node.componentPropertyDefinitions || {},
        screenshot: images[node.id],
        lastUpdated: figmaFile.lastModified,
      };

      if (componentsMap.has(baseName)) {
        const existingComponent = componentsMap.get(baseName)!;
        existingComponent.variants.push(variant);
        existingComponent.lastUpdated = figmaFile.lastModified;
      } else {
        const component: Component = {
          id: `${repositoryId}:${node.id}`,
          repositoryId,
          name: baseName,
          description: node.description || `Figma component: ${baseName}`,
          variants: [variant],
          category: this.categorizeComponent(baseName),
          tags: this.extractTags(node),
          documentation: node.description,
          lastUpdated: figmaFile.lastModified,
        };
        componentsMap.set(baseName, component);
      }
    }

    return Array.from(componentsMap.values());
  }
}

export const figmaService = new FigmaService();
