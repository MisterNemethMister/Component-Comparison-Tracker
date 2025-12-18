import { Component, ComponentVariant } from '../types/component';

export interface ComponentLibraryMetadata {
  name: string;
  version?: string;
  description?: string;
  components?: any[];
}

class ComponentLibraryService {
  async fetchComponentLibrary(
    url: string,
    authToken?: string
  ): Promise<ComponentLibraryMetadata> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') 
        ? authToken 
        : `Bearer ${authToken}`;
    }

    try {
      // Try to fetch the main URL
      const response = await fetch(url, { 
        headers,
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error('Authentication required. This component library requires a valid authentication token. Please add your token and try again.');
        }
        throw new Error(`Failed to fetch component library: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      // If it's HTML, try to parse for common patterns
      if (contentType?.includes('text/html')) {
        const html = await response.text();
        return this.parseHtmlForComponents(html, url);
      }

      // If it's JSON, try to parse directly
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return this.parseJsonComponentLibrary(data, url);
      }

      throw new Error('Unsupported content type. Expected JSON or HTML.');
    } catch (error) {
      console.error('Error fetching component library:', error);
      
      // Provide helpful error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Unable to fetch component library. This may be due to:\n' +
          '1. CORS restrictions - The library may not allow browser access\n' +
          '2. Authentication required - Try adding an authentication token\n' +
          '3. Network issues - Check your connection\n\n' +
          'For authenticated libraries like kumo-ui.com, you need to provide a valid access token.'
        );
      }
      
      throw error;
    }
  }

  private async parseHtmlForComponents(html: string, baseUrl: string): Promise<ComponentLibraryMetadata> {
    // Try to detect Storybook
    if (html.includes('storybook') || html.includes('__STORYBOOK_')) {
      return this.fetchStorybookComponents(baseUrl);
    }

    // Try to find component documentation patterns
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const name = titleMatch ? titleMatch[1] : 'Component Library';

    return {
      name,
      description: 'HTML-based component library (manual parsing required)',
      components: [],
    };
  }

  private async fetchStorybookComponents(baseUrl: string): Promise<ComponentLibraryMetadata> {
    try {
      // Try common Storybook API endpoints
      const apiUrl = new URL('/stories.json', baseUrl).toString();
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        return {
          name: 'Storybook Component Library',
          description: 'Storybook-based component documentation',
          components: this.parseStorybookStories(data),
        };
      }
    } catch (error) {
      console.warn('Failed to fetch Storybook stories:', error);
    }

    return {
      name: 'Storybook Component Library',
      description: 'Storybook detected but unable to fetch components',
      components: [],
    };
  }

  private parseStorybookStories(data: any): any[] {
    const components: any[] = [];
    
    if (data.stories) {
      Object.values(data.stories).forEach((story: any) => {
        components.push({
          id: story.id,
          name: story.name,
          title: story.title,
          kind: story.kind,
        });
      });
    }

    return components;
  }

  private parseJsonComponentLibrary(data: any, url: string): ComponentLibraryMetadata {
    // Handle different JSON structures
    if (data.components) {
      return {
        name: data.name || 'Component Library',
        version: data.version,
        description: data.description,
        components: data.components,
      };
    }

    // If it's an array, assume it's a list of components
    if (Array.isArray(data)) {
      return {
        name: 'Component Library',
        description: `Component library from ${url}`,
        components: data,
      };
    }

    return {
      name: data.name || 'Component Library',
      description: data.description,
      components: [],
    };
  }

  async convertLibraryToComponents(
    metadata: ComponentLibraryMetadata,
    repositoryId: string
  ): Promise<Component[]> {
    const components: Component[] = [];

    if (!metadata.components || metadata.components.length === 0) {
      return components;
    }

    const componentMap = new Map<string, Component>();

    for (const comp of metadata.components) {
      const name = comp.name || comp.title || comp.id || 'Unknown';
      const category = this.categorizeComponent(name, comp);
      
      const variant: ComponentVariant = {
        id: comp.id || `${repositoryId}:${name}`,
        name: comp.variant || 'Default',
        description: comp.description || '',
        props: comp.props || comp.parameters || {},
        lastUpdated: new Date().toISOString(),
      };

      if (componentMap.has(name)) {
        const existing = componentMap.get(name)!;
        existing.variants.push(variant);
      } else {
        const component: Component = {
          id: `${repositoryId}:${name}`,
          repositoryId,
          name,
          description: comp.description || `Component from library`,
          variants: [variant],
          category,
          tags: this.extractTags(comp),
          documentation: comp.documentation || comp.notes,
          lastUpdated: new Date().toISOString(),
        };
        componentMap.set(name, component);
      }
    }

    return Array.from(componentMap.values());
  }

  private categorizeComponent(name: string, data: any): string {
    const lowerName = name.toLowerCase();
    const kind = (data.kind || data.type || '').toLowerCase();
    
    if (lowerName.includes('button') || kind.includes('button')) return 'Button';
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

  private extractTags(data: any): string[] {
    const tags: string[] = [];
    const name = (data.name || '').toLowerCase();
    const kind = (data.kind || '').toLowerCase();

    if (name.includes('primary') || kind.includes('primary')) tags.push('primary');
    if (name.includes('secondary')) tags.push('secondary');
    if (name.includes('disabled')) tags.push('disabled');
    if (data.tags && Array.isArray(data.tags)) {
      tags.push(...data.tags);
    }

    return tags;
  }
}

export const componentLibraryService = new ComponentLibraryService();
