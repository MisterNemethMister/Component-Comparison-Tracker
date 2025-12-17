export interface ComponentVariant {
  id: string;
  name: string;
  description?: string;
  props: Record<string, any>;
  screenshot?: string;
  lastUpdated: string;
}

export interface Component {
  id: string;
  repositoryId?: string;
  name: string;
  description?: string;
  sourcePath?: string;
  variants: ComponentVariant[];
  category: string;
  tags: string[];
  documentation?: string;
  lastUpdated: string;
}

export interface Repository {
  id: string;
  name: string;
  path: string;
  description?: string;
  type: 'local' | 'remote' | 'figma';
  url?: string;
  branch?: string;
  figmaFileKey?: string;
  lastScanned?: string;
  componentCount?: number;
}

export interface ComponentLibrary {
  id: string;
  name: string;
  description?: string;
  repository: Repository;
  components: Component[];
  theme: {
    colors: Record<string, string>;
    typography: Record<string, any>;
    spacing: number[];
  };
  lastUpdated: string;
}

export interface ComponentComparison {
  componentName: string;
  repositories: {
    repositoryId: string;
    repositoryName: string;
    component?: Component;
    exists: boolean;
  }[];
  consistencyScore: number;
  differences: string[];
}
