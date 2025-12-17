import { Repository, ComponentLibrary, Component, ComponentComparison } from '../types/component';
import { repositoryScanner, ScanOptions } from './repositoryScanner';
import { figmaService } from './figmaService';

export class RepositoryManager {
  private repositories: Map<string, Repository> = new Map();
  private componentLibraries: Map<string, ComponentLibrary> = new Map();

  private getRepositoryIdFromComponentId(componentId: string): string | null {
    const idx = componentId.indexOf(':');
    if (idx <= 0) return null;
    return componentId.slice(0, idx);
  }

  private deriveSourcePathFromComponentId(componentId: string, componentName: string): string | undefined {
    const idx = componentId.indexOf(':');
    const withoutRepo = idx >= 0 ? componentId.slice(idx + 1) : componentId;
    const suffix = `-${componentName}`;
    if (withoutRepo.endsWith(suffix)) {
      const rel = withoutRepo.slice(0, -suffix.length);
      return rel || undefined;
    }
    const lastDash = withoutRepo.lastIndexOf('-');
    if (lastDash > 0) {
      const rel = withoutRepo.slice(0, lastDash);
      return rel || undefined;
    }
    return undefined;
  }

  // Load repositories from localStorage
  constructor() {
    this.loadRepositoriesFromStorage();
  }

  async addRepository(path: string, name?: string, description?: string): Promise<Repository> {
    try {
      // Get repository info
      const repoInfo = await repositoryScanner.getRepositoryInfo(path);
      
      const repository: Repository = {
        id: this.generateId(),
        name: name || repoInfo.name || 'Unknown Repository',
        path,
        description: description || repoInfo.description,
        type: 'local',
        lastScanned: undefined,
        componentCount: 0,
      };

      this.repositories.set(repository.id, repository);
      this.saveRepositoriesToStorage();
      
      return repository;
    } catch (error) {
      console.error('Failed to add repository:', error);
      throw new Error(`Failed to add repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addFigmaRepository(figmaUrl: string, name?: string, description?: string): Promise<Repository> {
    try {
      const fileKey = figmaService.extractFileKeyFromUrl(figmaUrl);
      if (!fileKey) {
        throw new Error('Invalid Figma URL. Please provide a valid Figma file URL.');
      }

      // Test API access by fetching file info
      const figmaFile = await figmaService.fetchFigmaFile(fileKey);
      
      const repository: Repository = {
        id: this.generateId(),
        name: name || figmaFile.name || 'Figma Components',
        path: figmaUrl,
        description: description || `Figma design file: ${figmaFile.name}`,
        type: 'figma',
        url: figmaUrl,
        figmaFileKey: fileKey,
        lastScanned: undefined,
        componentCount: 0,
      };

      this.repositories.set(repository.id, repository);
      this.saveRepositoriesToStorage();
      
      return repository;
    } catch (error) {
      console.error('Failed to add Figma repository:', error);
      throw new Error(`Failed to add Figma repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scanRepository(repositoryId: string, options?: Partial<ScanOptions>): Promise<ComponentLibrary> {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository not found: ${repositoryId}`);
    }

    try {
      let components: Component[] = [];

      if (repository.type === 'figma') {
        // Scan Figma repository
        if (!repository.figmaFileKey) {
          throw new Error('Figma file key not found');
        }
        components = await figmaService.convertFigmaToComponents(repository.figmaFileKey, repositoryId);
      } else {
        // Scan local repository
        const componentFiles = await repositoryScanner.scanRepository(repository.path, options);
        
        // Parse components from files
        for (const file of componentFiles) {
          const component = repositoryScanner.parseComponentFromFile(file);
          if (component) {
            const namespacedComponent: Component = {
              ...component,
              repositoryId,
              id: `${repositoryId}:${component.id}`,
              variants: component.variants.map((variant) => ({
                ...variant,
                id: `${repositoryId}:${variant.id}`,
              })),
            };
            components.push(namespacedComponent);
          }
        }
      }

      // Update repository info
      repository.lastScanned = new Date().toISOString();
      repository.componentCount = components.length;
      this.repositories.set(repositoryId, repository);

      // Create component library
      const componentLibrary: ComponentLibrary = {
        id: `${repositoryId}-library`,
        name: `${repository.name} Components`,
        description: `Component library for ${repository.name}`,
        repository,
        components,
        theme: {
          colors: {},
          typography: {},
          spacing: [],
        },
        lastUpdated: new Date().toISOString(),
      };

      this.componentLibraries.set(repositoryId, componentLibrary);
      this.saveRepositoriesToStorage();
      
      return componentLibrary;
    } catch (error) {
      console.error(`Failed to scan repository ${repositoryId}:`, error);
      throw new Error(`Failed to scan repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  removeRepository(repositoryId: string): boolean {
    const removed = this.repositories.delete(repositoryId);
    if (removed) {
      this.componentLibraries.delete(repositoryId);
      this.saveRepositoriesToStorage();
    }
    return removed;
  }

  getRepository(repositoryId: string): Repository | undefined {
    return this.repositories.get(repositoryId);
  }

  getAllRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }

  getComponentLibrary(repositoryId: string): ComponentLibrary | undefined {
    return this.componentLibraries.get(repositoryId);
  }

  getAllComponentLibraries(): ComponentLibrary[] {
    return Array.from(this.componentLibraries.values());
  }

  getAllComponents(): Component[] {
    const allComponents: Component[] = [];
    const libraries = Array.from(this.componentLibraries.values());
    for (const library of libraries) {
      allComponents.push(...library.components);
    }
    return allComponents;
  }

  compareComponents(): ComponentComparison[] {
    const componentsByName = new Map<string, Map<string, Component>>();
    const repositoryNames = new Map<string, string>();

    // Group components by name across all repositories
    const libraries = Array.from(this.componentLibraries.values());
    for (const library of libraries) {
      repositoryNames.set(library.repository.id, library.repository.name);
      
      for (const component of library.components) {
        if (!componentsByName.has(component.name)) {
          componentsByName.set(component.name, new Map());
        }
        componentsByName.get(component.name)!.set(library.repository.id, component);
      }
    }

    const comparisons: ComponentComparison[] = [];

    const componentEntries = Array.from(componentsByName.entries());
    for (const [componentName, repoComponents] of componentEntries) {
      const repositories = Array.from(this.repositories.keys()).map(repoId => ({
        repositoryId: repoId,
        repositoryName: repositoryNames.get(repoId) || 'Unknown',
        component: repoComponents.get(repoId),
        exists: repoComponents.has(repoId),
      }));

      const existingComponents = Array.from(repoComponents.values());
      const consistencyScore = this.calculateConsistencyScore(existingComponents);
      const differences = this.findDifferences(existingComponents);

      comparisons.push({
        componentName,
        repositories,
        consistencyScore,
        differences,
      });
    }

    return comparisons.sort((a, b) => a.consistencyScore - b.consistencyScore);
  }

  private calculateConsistencyScore(components: Component[]): number {
    if (components.length <= 1) return 100;

    let totalScore = 0;
    let comparisons = 0;

    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const score = this.compareComponentSimilarity(components[i], components[j]);
        totalScore += score;
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.round(totalScore / comparisons) : 100;
  }

  private compareComponentSimilarity(comp1: Component, comp2: Component): number {
    let score = 0;
    let factors = 0;

    // Compare categories
    if (comp1.category === comp2.category) score += 25;
    factors += 25;

    // Compare tags
    const commonTags = comp1.tags.filter(tag => comp2.tags.includes(tag));
    const allTags = new Set([...comp1.tags, ...comp2.tags]);
    const tagSimilarity = allTags.size > 0 ? (commonTags.length / allTags.size) * 25 : 25;
    score += tagSimilarity;
    factors += 25;

    // Compare variant count
    const variantDiff = Math.abs(comp1.variants.length - comp2.variants.length);
    const variantScore = Math.max(0, 25 - (variantDiff * 5));
    score += variantScore;
    factors += 25;

    // Compare descriptions (if both exist)
    if (comp1.description && comp2.description) {
      const descSimilarity = this.calculateStringSimilarity(comp1.description, comp2.description);
      score += descSimilarity * 25;
      factors += 25;
    }

    return factors > 0 ? (score / factors) * 100 : 100;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private findDifferences(components: Component[]): string[] {
    const differences: string[] = [];
    
    if (components.length <= 1) return differences;

    // Check for category differences
    const categories = new Set(components.map(c => c.category));
    if (categories.size > 1) {
      differences.push(`Different categories: ${Array.from(categories).join(', ')}`);
    }

    // Check for variant count differences
    const variantCounts = components.map(c => c.variants.length);
    const minVariants = Math.min(...variantCounts);
    const maxVariants = Math.max(...variantCounts);
    if (minVariants !== maxVariants) {
      differences.push(`Different variant counts: ${minVariants} to ${maxVariants}`);
    }

    // Check for tag differences
    const allTags = new Set<string>();
    components.forEach(c => c.tags.forEach(tag => allTags.add(tag)));
    const commonTags = Array.from(allTags).filter(tag => 
      components.every(c => c.tags.includes(tag))
    );
    if (commonTags.length < allTags.size) {
      differences.push(`Inconsistent tags across repositories`);
    }

    return differences;
  }

  private generateId(): string {
    return `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveRepositoriesToStorage(): void {
    try {
      const data = {
        repositories: Array.from(this.repositories.entries()),
        componentLibraries: Array.from(this.componentLibraries.entries()),
      };
      localStorage.setItem('component-tracker-repositories', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save repositories to storage:', error);
    }
  }

  private loadRepositoriesFromStorage(): void {
    try {
      const stored = localStorage.getItem('component-tracker-repositories');
      if (stored) {
        const data = JSON.parse(stored);
        this.repositories = new Map(data.repositories || []);
        this.componentLibraries = new Map(data.componentLibraries || []);

        for (const repoId of Array.from(this.componentLibraries.keys())) {
          if (!this.repositories.has(repoId)) {
            this.componentLibraries.delete(repoId);
            continue;
          }

          const library = this.componentLibraries.get(repoId);
          if (!library) continue;

          const migratedComponents = (library.components || []).map((component) => {
            const componentId = component.id.includes(':') ? component.id : `${repoId}:${component.id}`;
            const derivedRepoId = this.getRepositoryIdFromComponentId(componentId) || repoId;
            const derivedSourcePath =
              component.sourcePath || this.deriveSourcePathFromComponentId(componentId, component.name);
            const migratedVariants = (component.variants || []).map((variant) => ({
              ...variant,
              id: variant.id.includes(':') ? variant.id : `${repoId}:${variant.id}`,
            }));

            return {
              ...component,
              repositoryId: component.repositoryId || derivedRepoId,
              sourcePath: derivedSourcePath,
              id: componentId,
              variants: migratedVariants,
            };
          });

          this.componentLibraries.set(repoId, {
            ...library,
            repository: this.repositories.get(repoId) || library.repository,
            components: migratedComponents,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load repositories from storage:', error);
    }
  }
}

export const repositoryManager = new RepositoryManager();
