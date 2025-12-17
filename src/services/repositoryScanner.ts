import { Component, ComponentVariant, Repository } from '../types/component';

export interface ScanOptions {
  includePatterns: string[];
  excludePatterns: string[];
  componentExtensions: string[];
  maxDepth?: number;
}

export interface ComponentFile {
  path: string;
  name: string;
  content: string;
  extension: string;
  size: number;
  lastModified: Date;
}

export class RepositoryScanner {
  private defaultOptions: ScanOptions = {
    includePatterns: [
      '**/components/**/*',
      '**/src/components/**/*',
      '**/lib/components/**/*',
      '**/packages/*/components/**/*',
    ],
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
    ],
    componentExtensions: ['.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte'],
    maxDepth: 10,
  };

  async scanRepository(repositoryPath: string, options?: Partial<ScanOptions>): Promise<ComponentFile[]> {
    const mergedOptions: ScanOptions = {
      ...this.defaultOptions,
      ...(options || {}),
      includePatterns: options?.includePatterns || this.defaultOptions.includePatterns,
      excludePatterns: options?.excludePatterns || this.defaultOptions.excludePatterns,
      componentExtensions: options?.componentExtensions || this.defaultOptions.componentExtensions,
    };

    console.log(`Scanning repository: ${repositoryPath}`);

    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: repositoryPath, options: mergedOptions }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data?.error || `Scan failed (${resp.status})`;
        throw new Error(message);
      }

      const files = Array.isArray(data?.files) ? data.files : [];
      return files.map((f: any) => ({
        path: String(f.path || ''),
        name: String(f.name || ''),
        content: String(f.content || ''),
        extension: String(f.extension || ''),
        size: Number(f.size || 0),
        lastModified: new Date(f.lastModified || Date.now()),
      })) as ComponentFile[];
    } catch (error) {
      console.error('Repository scan failed:', error);
      throw new Error(
        `Failed to scan repository. Make sure the scanner server is running (npm run start:scanner). ` +
          `${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getRepoNameFromPath(repositoryPath: string): string {
    const parts = repositoryPath.split('/');
    return parts[parts.length - 1] || 'unknown-repo';
  }

  private generateMockComponentFiles(repoName: string, repositoryPath: string): ComponentFile[] {
    const mockFiles: ComponentFile[] = [];
    const now = new Date();

    // Generate different mock components based on repository name
    if (repoName.toLowerCase().includes('stratus') || repoName.toLowerCase().includes('cloudflare')) {
      // Mock Stratus/Cloudflare components
      mockFiles.push(
        {
          path: 'src/components/Button/Button.tsx',
          name: 'Button',
          content: this.generateMockButtonComponent('Stratus'),
          extension: '.tsx',
          size: 1024,
          lastModified: now,
        },
        {
          path: 'src/components/Card/Card.tsx',
          name: 'Card',
          content: this.generateMockCardComponent('Stratus'),
          extension: '.tsx',
          size: 856,
          lastModified: now,
        },
        {
          path: 'src/components/Alert/Alert.tsx',
          name: 'Alert',
          content: this.generateMockAlertComponent('Stratus'),
          extension: '.tsx',
          size: 742,
          lastModified: now,
        }
      );
    } else {
      // Generic repository components
      mockFiles.push(
        {
          path: 'components/Button/index.tsx',
          name: 'Button',
          content: this.generateMockButtonComponent('Generic'),
          extension: '.tsx',
          size: 892,
          lastModified: now,
        },
        {
          path: 'components/Modal/Modal.tsx',
          name: 'Modal',
          content: this.generateMockModalComponent(),
          extension: '.tsx',
          size: 1156,
          lastModified: now,
        }
      );
    }

    return mockFiles;
  }

  private generateMockButtonComponent(variant: string): string {
    if (variant === 'Stratus') {
      return `
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * Stratus Button component with Cloudflare design system
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      className={\`cf-button cf-button--\${variant} cf-button--\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
      `.trim();
    } else {
      return `
import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * Generic Button component
 */
export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  variant = 'contained',
  color = 'primary',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      type={type}
      className={\`btn btn-\${variant} btn-\${color}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
      `.trim();
    }
  }

  private generateMockCardComponent(variant: string): string {
    return `
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  elevation?: number;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

/**
 * ${variant} Card component for content containers
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  elevation = 1,
  padding = 'medium',
}) => {
  return (
    <div className={\`card elevation-\${elevation} padding-\${padding}\`}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;
    `.trim();
  }

  private generateMockAlertComponent(variant: string): string {
    return `
import React from 'react';

interface AlertProps {
  severity?: 'info' | 'success' | 'warning' | 'error';
  variant?: 'filled' | 'outlined' | 'standard';
  children: React.ReactNode;
  onClose?: () => void;
}

/**
 * ${variant} Alert component for notifications
 */
export const Alert: React.FC<AlertProps> = ({
  severity = 'info',
  variant = 'standard',
  children,
  onClose,
}) => {
  return (
    <div className={\`alert alert-\${severity} alert-\${variant}\`}>
      <div className="alert-content">{children}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
    `.trim();
  }

  private generateMockModalComponent(): string {
    return `
import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal component for dialogs and overlays
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className={\`modal-content modal-\${maxWidth}\`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose}>×</button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
    `.trim();
  }

  parseComponentFromFile(file: ComponentFile): Component | null {
    try {
      const component = this.extractComponentInfo(file);
      return component;
    } catch (error) {
      console.warn(`Failed to parse component from ${file.path}:`, error);
      return null;
    }
  }

  private extractComponentInfo(file: ComponentFile): Component | null {
    const { content, name, path: filePath } = file;
    
    // Basic component detection patterns
    const componentPatterns = [
      /export\s+(?:default\s+)?(?:function|const)\s+(\w+)/g,
      /export\s+(?:default\s+)?class\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*(?:React\.)?(?:forwardRef|memo)?\s*\(/g,
      /function\s+(\w+)\s*\(/g,
    ];

    // Extract component names
    const componentNames = new Set<string>();
    for (const pattern of componentPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const componentName = match[1];
        // Filter out common non-component names
        if (this.isLikelyComponentName(componentName)) {
          componentNames.add(componentName);
        }
      }
    }

    if (componentNames.size === 0) {
      return null;
    }

    // Use the first component name found or the filename
    const primaryComponentName = componentNames.has(name) ? name : Array.from(componentNames)[0];

    // Extract props interface if available
    const propsPattern = new RegExp(`interface\\s+${primaryComponentName}Props\\s*\\{([^}]+)\\}`, 'g');
    const propsMatch = propsPattern.exec(content);
    
    // Extract JSDoc comments for description
    const jsdocPattern = /\/\*\*\s*\n\s*\*\s*([^\n]+)/;
    const jsdocMatch = jsdocPattern.exec(content);
    const description = jsdocMatch ? jsdocMatch[1].trim() : undefined;

    // Determine category based on file path
    const category = this.inferCategoryFromPath(filePath);

    // Extract tags from comments and imports
    const tags = this.extractTags(content, filePath);

    const component: Component = {
      id: `${filePath}-${primaryComponentName}`,
      name: primaryComponentName,
      description,
      sourcePath: filePath,
      category,
      tags,
      lastUpdated: file.lastModified.toISOString(),
      variants: [
        {
          id: `${filePath}-${primaryComponentName}-default`,
          name: 'Default',
          description: 'Default variant',
          props: propsMatch ? this.parsePropsFromInterface(propsMatch[1]) : {},
          lastUpdated: file.lastModified.toISOString(),
        },
      ],
    };

    return component;
  }

  private isLikelyComponentName(name: string): boolean {
    // Component names should start with uppercase and not be common non-component names
    const nonComponentNames = ['React', 'Component', 'Fragment', 'useState', 'useEffect', 'Props', 'State'];
    return /^[A-Z]/.test(name) && !nonComponentNames.includes(name) && name.length > 1;
  }

  private inferCategoryFromPath(filePath: string): string {
    const pathLower = filePath.toLowerCase();
    
    if (pathLower.includes('/button') || pathLower.includes('/input') || pathLower.includes('/form')) {
      return 'Inputs';
    } else if (pathLower.includes('/card') || pathLower.includes('/paper') || pathLower.includes('/surface')) {
      return 'Surfaces';
    } else if (pathLower.includes('/alert') || pathLower.includes('/notification') || pathLower.includes('/toast')) {
      return 'Feedback';
    } else if (pathLower.includes('/nav') || pathLower.includes('/menu') || pathLower.includes('/breadcrumb')) {
      return 'Navigation';
    } else if (pathLower.includes('/layout') || pathLower.includes('/grid') || pathLower.includes('/container')) {
      return 'Layout';
    } else if (pathLower.includes('/text') || pathLower.includes('/typography') || pathLower.includes('/heading')) {
      return 'Typography';
    }
    
    return 'Other';
  }

  private extractTags(content: string, filePath: string): string[] {
    const tags = new Set<string>();
    
    // Add tags based on imports
    if (content.includes('useState') || content.includes('useEffect')) {
      tags.add('interactive');
    }
    if (content.includes('form') || content.includes('Form')) {
      tags.add('form');
    }
    if (content.includes('onClick') || content.includes('onSubmit')) {
      tags.add('action');
    }
    
    // Add tags based on file path
    const pathSegments = filePath.toLowerCase().split('/');
    pathSegments.forEach(segment => {
      if (['button', 'input', 'form', 'card', 'alert', 'modal', 'dialog'].includes(segment)) {
        tags.add(segment);
      }
    });
    
    return Array.from(tags);
  }

  private parsePropsFromInterface(propsString: string): Record<string, any> {
    const props: Record<string, any> = {};
    
    // Simple prop extraction - this could be enhanced with a proper TypeScript parser
    const propLines = propsString.split('\n');
    for (const line of propLines) {
      const match = line.match(/^\s*(\w+)\??\s*:\s*([^;]+)/);
      if (match) {
        const [, propName, propType] = match;
        props[propName] = {
          type: propType.trim(),
          optional: line.includes('?'),
        };
      }
    }
    
    return props;
  }

  async getRepositoryInfo(repositoryPath: string): Promise<Partial<Repository>> {
    try {
      const resp = await fetch(`/api/repo-info?path=${encodeURIComponent(repositoryPath)}`);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data?.error || `Failed to get repository info (${resp.status})`;
        throw new Error(message);
      }

      return {
        name: data?.name,
        description: data?.description,
        type: 'local' as const,
        lastScanned: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting repository info for ${repositoryPath}:`, error);
      throw new Error(
        `Failed to get repository info. Make sure the scanner server is running (npm run start:scanner). ` +
          `${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const repositoryScanner = new RepositoryScanner();
