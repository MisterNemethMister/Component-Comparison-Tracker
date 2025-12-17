import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Component, ComponentVariant } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

interface ComponentPreviewProps {
  component: Component;
  selectedVariant?: ComponentVariant;
  showCode?: boolean;
  onVariantChange?: (variant: ComponentVariant) => void;
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
      id={`preview-tabpanel-${index}`}
      aria-labelledby={`preview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  component,
  selectedVariant,
  showCode = true,
  onVariantChange,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentVariant, setCurrentVariant] = useState<ComponentVariant>(
    selectedVariant || component.variants[0]
  );
  const [darkMode, setDarkMode] = useState(false);
  const [showProps, setShowProps] = useState(true);
  const [realRenderError, setRealRenderError] = useState<string | null>(null);
  const [realRenderKey, setRealRenderKey] = useState(0);

  useEffect(() => {
    if (selectedVariant) {
      setCurrentVariant(selectedVariant);
    }
  }, [selectedVariant]);

  useEffect(() => {
    setRealRenderError(null);
  }, [component.id, component.sourcePath, currentVariant.id, darkMode]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleVariantChange = (variant: ComponentVariant) => {
    setCurrentVariant(variant);
    if (onVariantChange) {
      onVariantChange(variant);
    }
  };

  const generateComponentCode = (variant: ComponentVariant) => {
    const props = Object.entries(variant.props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else if (typeof value === 'object' && value !== null) {
          return `${key}={${JSON.stringify(value)}}`;
        } else {
          return `${key}={${value}}`;
        }
      })
      .join('\n  ');

    return `<${component.name}${props ? `\n  ${props}` : ''}${
      variant.props.children ? `>\n  ${variant.props.children}\n</${component.name}>` : ' />'
    }`;
  };

  const renderMockComponent = (variant: ComponentVariant) => {
    const componentName = component.name.toLowerCase();
    const props = variant.props;

    // Helper function to safely get string props
    const getStringProp = (value: any, defaultValue: string): string => {
      return typeof value === 'string' ? value : defaultValue;
    };

    // Helper function to safely get boolean props
    const getBooleanProp = (value: any, defaultValue: boolean): boolean => {
      return typeof value === 'boolean' ? value : defaultValue;
    };

    // Helper function to safely get number props
    const getNumberProp = (value: any, defaultValue: number): number => {
      return typeof value === 'number' ? value : defaultValue;
    };

    // Generate different mock components based on component type
    switch (componentName) {
      case 'button':
        const buttonVariant = getStringProp(props.variant, 'contained');
        const buttonColor = getStringProp(props.color, 'primary');
        const buttonSize = getStringProp(props.size, 'medium');
        
        return (
          <Button
            variant={['text', 'outlined', 'contained'].includes(buttonVariant) ? buttonVariant as any : 'contained'}
            color={['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'].includes(buttonColor) ? buttonColor as any : 'primary'}
            size={['small', 'medium', 'large'].includes(buttonSize) ? buttonSize as any : 'medium'}
            disabled={getBooleanProp(props.disabled, false)}
            startIcon={getBooleanProp(props.startIcon, false) ? <VisibilityIcon /> : undefined}
            endIcon={getBooleanProp(props.endIcon, false) ? <CodeIcon /> : undefined}
          >
            {getStringProp(props.children || props.label, 'Button')}
          </Button>
        );

      case 'card':
        return (
          <Paper
            elevation={getNumberProp(props.elevation, 1)}
            sx={{
              p: props.padding === 'none' ? 0 : props.padding === 'small' ? 1 : props.padding === 'large' ? 3 : 2,
              maxWidth: 300,
            }}
          >
            {props.title && (
              <Typography variant="h6" gutterBottom>
                {getStringProp(props.title, '')}
              </Typography>
            )}
            <Typography variant="body2">
              {getStringProp(props.children, 'This is a sample card component with some content to demonstrate the layout and styling.')}
            </Typography>
          </Paper>
        );

      case 'alert':
        const alertSeverity = getStringProp(props.severity, 'info');
        const alertVariant = getStringProp(props.variant, 'standard');
        
        return (
          <Alert
            severity={['error', 'warning', 'info', 'success'].includes(alertSeverity) ? alertSeverity as any : 'info'}
            variant={['standard', 'filled', 'outlined'].includes(alertVariant) ? alertVariant as any : 'standard'}
            onClose={getBooleanProp(props.onClose, false) ? () => {} : undefined}
          >
            {getStringProp(props.children, 'This is a sample alert message')}
          </Alert>
        );

      case 'chip':
        const chipVariant = getStringProp(props.variant, 'filled');
        const chipColor = getStringProp(props.color, 'default');
        const chipSize = getStringProp(props.size, 'medium');
        
        return (
          <Chip
            label={getStringProp(props.label || props.children, 'Sample Chip')}
            variant={['filled', 'outlined'].includes(chipVariant) ? chipVariant as any : 'filled'}
            color={['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(chipColor) ? chipColor as any : 'default'}
            size={['small', 'medium'].includes(chipSize) ? chipSize as any : 'medium'}
            onDelete={getBooleanProp(props.onDelete, false) ? () => {} : undefined}
            icon={getBooleanProp(props.icon, false) ? <VisibilityIcon /> : undefined}
          />
        );

      case 'textfield':
      case 'input':
        return (
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {component.name} Component
            </Typography>
            <input
              type={props.type || 'text'}
              placeholder={props.placeholder || 'Enter text...'}
              disabled={props.disabled || false}
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
          </Box>
        );

      default:
        // Generic component preview
        return (
          <Paper
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: darkMode ? 'grey.900' : 'background.paper',
              color: darkMode ? 'common.white' : 'text.primary',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography variant="h6" color="primary">
              {component.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {variant.name} Variant
            </Typography>
            {Object.keys(props).length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {Object.keys(props).length} props configured
              </Typography>
            )}
          </Paper>
        );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Code copied to clipboard');
    });
  };

  const getRepositoryIdFromComponentId = (componentId: string): string | null => {
    const idx = componentId.indexOf(':');
    if (idx <= 0) return null;
    return componentId.slice(0, idx);
  };

  const getBundleUrl = (): string | null => {
    if (!component.sourcePath) return null;
    const repoId = component.repositoryId || getRepositoryIdFromComponentId(component.id);
    if (!repoId) return null;
    const repo = repositoryManager.getRepository(repoId);
    if (!repo?.path) return null;
    const qs = new URLSearchParams({
      repoPath: repo.path,
      file: component.sourcePath,
    });
    return `/api/bundle?${qs.toString()}`;
  };

  const bundleUrl = getBundleUrl();

  const renderRealComponentFrame = () => {
    if (!bundleUrl) return null;

    const propsJson = JSON.stringify(currentVariant.props || {});
    const componentName = JSON.stringify(component.name);
    const dark = JSON.stringify(darkMode);
    const iframeHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { height: 100%; margin: 0; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      #root { height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19?dev",
          "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime?dev",
          "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime?dev",
          "react-dom": "https://esm.sh/react-dom@19?dev",
          "react-dom/client": "https://esm.sh/react-dom@19/client?dev",
          "@mui/material": "https://esm.sh/@mui/material@7?dev",
          "@mui/material/": "https://esm.sh/@mui/material@7/",
          "@mui/icons-material": "https://esm.sh/@mui/icons-material@7?dev",
          "@mui/icons-material/": "https://esm.sh/@mui/icons-material@7/",
          "@emotion/react": "https://esm.sh/@emotion/react@11?dev",
          "@emotion/styled": "https://esm.sh/@emotion/styled@11?dev"
        }
      }
    </script>
    <script type="module">
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

      const rootEl = document.getElementById('root');
      const root = createRoot(rootEl);

      const props = ${propsJson};
      const componentName = ${componentName};
      const darkMode = ${dark};

      const theme = createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } });

      async function main() {
        const resp = await fetch(${JSON.stringify(bundleUrl)});
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text);
        }

        const js = await resp.text();
        const blobUrl = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
        const mod = await import(blobUrl);
        URL.revokeObjectURL(blobUrl);

        const Comp = (mod && (mod.default || mod[componentName])) || null;
        if (!Comp) {
          throw new Error('Could not find a React component export (default or named)');
        }
        root.render(
          React.createElement(
            ThemeProvider,
            { theme },
            React.createElement(CssBaseline, null),
            React.createElement(Comp, props)
          )
        );
      }

      main().catch((err) => {
        const msg = err && err.message ? err.message : String(err);
        window.parent.postMessage({ type: 'component-preview-error', message: msg }, '*');
        root.render(React.createElement('pre', { style: { whiteSpace: 'pre-wrap', color: '#b00020' } }, msg));
      });
    </script>
  </body>
</html>`;

    return (
      <iframe
        key={`${component.id}:${currentVariant.id}:${realRenderKey}:${darkMode ? 'dark' : 'light'}`}
        title={`preview-${component.id}`}
        style={{ width: '100%', height: 260, border: '0', background: darkMode ? '#121212' : '#fafafa' }}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={iframeHtml}
        onLoad={() => {
          // no-op
        }}
      />
    );
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data: any = event.data;
      if (data?.type === 'component-preview-error') {
        setRealRenderError(String(data.message || 'Failed to render component'));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Variant Selector */}
      {component.variants.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Variant
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {component.variants.map((variant) => (
              <Chip
                key={variant.id}
                label={variant.name}
                onClick={() => handleVariantChange(variant)}
                color={currentVariant.id === variant.id ? 'primary' : 'default'}
                variant={currentVariant.id === variant.id ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                size="small"
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showProps}
                onChange={(e) => setShowProps(e.target.checked)}
                size="small"
              />
            }
            label="Show Props"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Preview">
            <IconButton
              size="small"
              onClick={() => {
                setRealRenderError(null);
                setRealRenderKey((k) => k + 1);
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen Preview">
            <IconButton size="small">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="component preview tabs">
          <Tab icon={<VisibilityIcon />} label="Preview" />
          {showCode && <Tab icon={<CodeIcon />} label="Code" />}
        </Tabs>
      </Box>

      {/* Preview Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ p: 3 }}>
          {/* Component Preview */}
          <Paper
            sx={{
              p: 3,
              bgcolor: darkMode ? 'grey.900' : 'grey.50',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%' }}>
              {realRenderError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Real preview failed: {realRenderError}. Showing fallback preview.
                </Alert>
              )}
              {!bundleUrl && !realRenderError && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Real preview unavailable. Missing repository mapping or source path.
                  <Box component="div" sx={{ mt: 1, fontFamily: 'monospace', fontSize: 12, opacity: 0.9 }}>
                    <div>sourcePath: {String(component.sourcePath || '')}</div>
                    <div>repositoryId: {String(component.repositoryId || '')}</div>
                    <div>id: {String(component.id || '')}</div>
                  </Box>
                </Alert>
              )}
              {bundleUrl && !realRenderError ? (
                renderRealComponentFrame()
              ) : (
                renderMockComponent(currentVariant)
              )}
            </Box>
          </Paper>

          {/* Props Display */}
          {showProps && Object.keys(currentVariant.props).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Props
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>
                  {JSON.stringify(currentVariant.props, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Code Tab */}
      {showCode && (
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2">
                JSX Code for {currentVariant.name} Variant
              </Typography>
              <Tooltip title="Copy to Clipboard">
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(generateComponentCode(currentVariant))}
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>
                <code>{generateComponentCode(currentVariant)}</code>
              </pre>
            </Paper>

            {/* TypeScript Interface */}
            {Object.keys(currentVariant.props).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Props Interface
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>
                    <code>
{`interface ${component.name}Props {
${Object.entries(currentVariant.props)
  .map(([key, value]) => {
    const type = typeof value === 'object' && value?.type ? value.type : typeof value;
    const optional = typeof value === 'object' && value?.optional ? '?' : '';
    return `  ${key}${optional}: ${type};`;
  })
  .join('\n')}
}`}
                    </code>
                  </pre>
                </Paper>
              </Box>
            )}
          </Box>
        </TabPanel>
      )}
    </Box>
  );
};
