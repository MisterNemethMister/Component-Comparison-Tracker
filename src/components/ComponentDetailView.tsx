import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  Compare as CompareIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Component } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

interface ComponentDetailViewProps {
  componentId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (componentId: string) => void;
  onCompare?: (componentName: string) => void;
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
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const ComponentDetailView: React.FC<ComponentDetailViewProps> = ({
  componentId,
  open,
  onClose,
  onEdit,
  onCompare,
}) => {
  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState<string | false>(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sourceCode, setSourceCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [editedCode, setEditedCode] = useState<string>('');
  const [isEditingCode, setIsEditingCode] = useState(false);

  useEffect(() => {
    if (open && componentId) {
      loadComponent(componentId);
    }
  }, [open, componentId]);

  useEffect(() => {
    if (component && open) {
      loadSourceCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, open]);

  const loadComponent = (id: string) => {
    setLoading(true);
    try {
      // Find component across all repositories
      const allComponents = repositoryManager.getAllComponents();
      const foundComponent = allComponents.find(comp => comp.id === id);
      
      if (foundComponent) {
        setComponent(foundComponent);
      } else {
        setComponent(null);
      }
    } catch (error) {
      console.error('Failed to load component:', error);
      setComponent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantAccordionChange = (variantId: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedVariant(isExpanded ? variantId : false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

    // Try to determine repository from component ID or path
    if (component.id.includes('ztx-frontend')) return 'ZTX Frontend';
    if (component.id.includes('kumo-kit')) return 'Kumo Kit';
    if (component.id.includes('stratus')) return 'Stratus';
    if (component.id.includes('component-consistency-tracker')) return 'Component Tracker';
    return 'Unknown Repository';
  };

  const renderPropValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const loadSourceCode = async () => {
    if (!component?.sourcePath || !component?.repositoryId) {
      setCodeError('Source path not available for this component');
      return;
    }

    setLoadingCode(true);
    setCodeError(null);

    try {
      const repo = repositoryManager.getRepository(component.repositoryId);
      if (!repo?.path) {
        throw new Error('Repository not found');
      }

      const response = await fetch('/api/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: repo.path,
          filePath: component.sourcePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load source code (${response.status})`);
      }

      const data = await response.json();
      setSourceCode(data.content || '');
      setEditedCode(data.content || '');
    } catch (error) {
      console.error('Failed to load source code:', error);
      setCodeError(error instanceof Error ? error.message : 'Failed to load source code');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleSaveCode = async () => {
    if (!component?.sourcePath || !component?.repositoryId) return;

    try {
      const repo = repositoryManager.getRepository(component.repositoryId);
      if (!repo?.path) {
        throw new Error('Repository not found');
      }

      const response = await fetch('/api/source', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: repo.path,
          filePath: component.sourcePath,
          content: editedCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save source code');
      }

      setSourceCode(editedCode);
      setIsEditingCode(false);
    } catch (error) {
      console.error('Failed to save source code:', error);
      alert(error instanceof Error ? error.message : 'Failed to save source code');
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sourceCode).then(() => {
      console.log('Code copied to clipboard');
    });
  };


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!component && !loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Component Not Found</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            The requested component could not be found.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CodeIcon color="primary" />
            <Typography variant="h5" component="span">
              {component?.name || 'Loading...'}
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
            <Typography>Loading component details...</Typography>
          </Box>
        ) : component ? (
          <Box>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="component detail tabs">
                <Tab label="Basic Info" />
                <Tab label="Variants" />
                <Tab label="Code" />
              </Tabs>
            </Box>

            {/* Basic Info Tab */}
            <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              {component.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {component.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Repository
                  </Typography>
                  <Typography variant="body1">
                    {getRepositoryName(component)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    {component.category}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(component.lastUpdated)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Tags
                  </Typography>
                  {component.tags.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {component.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1">
                      N/A
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Documentation */}
            {component.documentation && (
              <>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Documentation
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {component.documentation}
                    </Typography>
                  </Paper>
                </Box>
                <Divider />
              </>
            )}
          </Box>
            </TabPanel>

            {/* Variants Tab */}
            <TabPanel value={activeTab} index={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Variants ({component.variants.length})
              </Typography>
              
              {component.variants.map((variant) => (
                <Accordion
                  key={variant.id}
                  expanded={expandedVariant === variant.id}
                  onChange={handleVariantAccordionChange(variant.id)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {variant.name}
                      </Typography>
                      {variant.description && (
                        <Typography variant="body2" color="text.secondary">
                          - {variant.description}
                        </Typography>
                      )}
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {formatDate(variant.lastUpdated)}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Variant Props */}
                      {Object.keys(variant.props).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Props
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Property</TableCell>
                                  <TableCell>Value</TableCell>
                                  <TableCell>Type</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(variant.props).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {key}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {renderPropValue(value)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {typeof value === 'object' && value?.type ? value.type : typeof value}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Screenshot placeholder */}
                      {variant.screenshot && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Preview
                          </Typography>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary">
                              Screenshot: {variant.screenshot}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </TabPanel>

          {/* Code Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6">
                    Source Code
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isEditingCode && sourceCode && (
                      <>
                        <Tooltip title="Copy Code">
                          <IconButton size="small" onClick={copyCodeToClipboard}>
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setIsEditingCode(true)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                    {isEditingCode && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setEditedCode(sourceCode);
                            setIsEditingCode(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveCode}
                        >
                          Save
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>

                {loadingCode ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : codeError ? (
                  <Alert severity="warning">{codeError}</Alert>
                ) : isEditingCode ? (
                  <TextField
                    multiline
                    fullWidth
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      },
                    }}
                    minRows={20}
                    maxRows={30}
                  />
                ) : (
                  <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', overflow: 'auto', maxHeight: '60vh' }}>
                    <pre style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      <code>{sourceCode || 'No source code available'}</code>
                    </pre>
                  </Paper>
                )}

                {component.sourcePath && (
                  <Typography variant="caption" color="text.secondary">
                    File: {component.sourcePath}
                  </Typography>
                )}
              </Box>
            </Box>
            </TabPanel>
          </Box>
        ) : (
          <Alert severity="error">
            Component not found or failed to load.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        {component && onCompare && (
          <Button
            variant="outlined"
            onClick={() => onCompare(component.name)}
            startIcon={<CompareIcon />}
          >
            Open Full Comparison View
          </Button>
        )}
        {component && onEdit && (
          <Button
            variant="outlined"
            onClick={() => onEdit(component.id)}
            startIcon={<CodeIcon />}
          >
            Edit Metadata
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
