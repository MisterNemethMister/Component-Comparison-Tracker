import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { Component } from '../types/component';
import { ComponentPreview } from './ComponentPreview';
import { repositoryManager } from '../services/repositoryManager';

interface VisualComponentComparisonProps {
  componentName: string | null;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`comparison-tabpanel-${index}`}
      aria-labelledby={`comparison-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const VisualComponentComparison: React.FC<VisualComponentComparisonProps> = ({
  componentName,
  open,
  onClose,
}) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && componentName) {
      loadComponentsForComparison(componentName);
    }
  }, [open, componentName]);

  const loadComponentsForComparison = (name: string) => {
    setLoading(true);
    try {
      // Find all components with the same name across repositories
      const allComponents = repositoryManager.getAllComponents();
      const matchingComponents = allComponents.filter(
        comp => comp.name.toLowerCase() === name.toLowerCase()
      );

      setComponents(matchingComponents);
    } catch (error) {
      console.error('Failed to load components for comparison:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getRepositoryIdFromComponentId = (componentId: string): string | null => {
    const idx = componentId.indexOf(':');
    if (idx <= 0) return null;
    return componentId.slice(0, idx);
  };

  const getRepositoryName = (component: Component) => {
    const repoId = getRepositoryIdFromComponentId(component.id);
    if (repoId) {
      const repo = repositoryManager.getRepository(repoId);
      if (repo?.name) return repo.name;
    }

    // Fallback for demo/mock component ids
    if (component.id.includes('ztx-frontend')) return 'ZTX Frontend';
    if (component.id.includes('kumo-kit')) return 'Kumo Kit';
    if (component.id.includes('stratus')) return 'Stratus';
    return 'Unknown Repository';
  };

  const getConsistencyIndicator = (components: Component[]) => {
    if (components.length <= 1) return { color: 'success', label: 'Single Implementation' };
    
    // Simple consistency check based on variant count and category
    const categories = new Set(components.map(c => c.category));
    const variantCounts = components.map(c => c.variants.length);
    const minVariants = Math.min(...variantCounts);
    const maxVariants = Math.max(...variantCounts);
    
    if (categories.size === 1 && minVariants === maxVariants) {
      return { color: 'success', label: 'Highly Consistent' };
    } else if (categories.size <= 2 && (maxVariants - minVariants) <= 1) {
      return { color: 'warning', label: 'Moderately Consistent' };
    } else {
      return { color: 'error', label: 'Inconsistent' };
    }
  };

  if (!componentName) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CompareIcon color="primary" />
            <Typography variant="h5" component="span">
              Visual Comparison: {componentName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading components for comparison...</Typography>
          </Box>
        ) : components.length === 0 ? (
          <Alert severity="info">
            No components found with the name "{componentName}" across repositories.
          </Alert>
        ) : (
          <Box>
            {/* Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Found {components.length} implementation{components.length !== 1 ? 's' : ''} across repositories
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {components.map((component, index) => (
                  <Chip
                    key={component.id}
                    label={getRepositoryName(component)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="comparison tabs">
                <Tab icon={<VisibilityIcon />} label="Visual Comparison" />
                <Tab icon={<CodeIcon />} label="Code Comparison" />
              </Tabs>
            </Box>

            {/* Visual Comparison Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                {components.map((component) => (
                  <Paper key={component.id} sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
                    {/* Repository Header */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📁 {getRepositoryName(component)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {component.name} Component
                      </Typography>
                    </Box>
                    
                    {/* Component Details */}
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={component.category}
                          size="small"
                          color="secondary"
                          variant="filled"
                        />
                        <Chip
                          label={`${component.variants.length} variant${component.variants.length !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {component.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {component.description}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Component Preview */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <ComponentPreview 
                        component={component} 
                        showCode={false}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </TabPanel>

            {/* Code Comparison Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {components.map((component) => (
                  <Paper key={component.id} sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
                    {/* Repository Header */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'secondary.main', 
                      color: 'secondary.contrastText',
                      borderBottom: 1,
                      borderColor: 'divider'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        💻 {getRepositoryName(component)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {component.name} Implementation
                      </Typography>
                    </Box>
                    
                    {/* Code Content */}
                    <Box sx={{ p: 2 }}>
                    
                    {component.variants.map((variant) => (
                      <Box key={variant.id} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {variant.name} Variant
                        </Typography>
                        
                        {/* JSX Code */}
                        <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', mb: 2 }}>
                          <Typography variant="caption" color="grey.400" gutterBottom display="block">
                            JSX Usage:
                          </Typography>
                          <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', overflow: 'auto' }}>
                            <code>
{`<${component.name}${Object.entries(variant.props).length > 0 ? '\n' + Object.entries(variant.props)
  .map(([key, value]) => {
    if (typeof value === 'string') return `  ${key}="${value}"`;
    if (typeof value === 'boolean') return value ? `  ${key}` : `  ${key}={false}`;
    return `  ${key}={${JSON.stringify(value)}}`;
  })
  .join('\n') + '\n' : ''}${variant.props.children ? `>\n  ${variant.props.children}\n</${component.name}>` : ' />'}`}
                            </code>
                          </pre>
                        </Paper>

                        {/* Props */}
                        {Object.keys(variant.props).length > 0 && (
                          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                              Props:
                            </Typography>
                            <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace' }}>
                              {JSON.stringify(variant.props, null, 2)}
                            </pre>
                          </Paper>
                        )}
                      </Box>
                    ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </TabPanel>

            {/* Consistency Analysis */}
            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Consistency Analysis
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Categories
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Array.from(new Set(components.map(c => c.category))).map(category => (
                      <Chip key={category} label={category} size="small" />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Variant Counts
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {components.map((comp, idx) => (
                      <Chip 
                        key={idx} 
                        label={`${getRepositoryName(comp)}: ${comp.variants.length}`} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Common Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Array.from(new Set(components.flatMap(c => c.tags))).slice(0, 5).map(tag => (
                      <Chip key={tag} label={tag} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close Comparison
        </Button>
      </DialogActions>
    </Dialog>
  );
};
