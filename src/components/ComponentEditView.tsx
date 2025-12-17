import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Component, ComponentVariant } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

interface ComponentEditViewProps {
  componentId: string | null;
  open: boolean;
  onClose: () => void;
  onSave?: (component: Component) => void;
}

const CATEGORIES = [
  'Inputs',
  'Surfaces',
  'Feedback',
  'Navigation',
  'Layout',
  'Typography',
  'Data Display',
  'Other',
];

const COMMON_TAGS = [
  'interactive',
  'form',
  'action',
  'container',
  'content',
  'layout',
  'notification',
  'message',
  'status',
  'button',
  'input',
  'card',
  'alert',
  'modal',
  'dialog',
];

export const ComponentEditView: React.FC<ComponentEditViewProps> = ({
  componentId,
  open,
  onClose,
  onSave,
}) => {
  const [editedComponent, setEditedComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && componentId) {
      loadComponent(componentId);
    }
  }, [open, componentId]);

  const loadComponent = (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Find component across all repositories
      const allComponents = repositoryManager.getAllComponents();
      const foundComponent = allComponents.find(comp => comp.id === id);
      
      if (foundComponent) {
        setEditedComponent({ ...foundComponent });
      } else {
        setError('Component not found');
      }
    } catch (error) {
      console.error('Failed to load component:', error);
      setError('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedComponent) return;

    setSaving(true);
    setError(null);

    try {
      // Update the last modified timestamp
      const updatedComponent = {
        ...editedComponent,
        lastUpdated: new Date().toISOString(),
      };

      // In a real implementation, this would save to the backend
      console.log('Saving component:', updatedComponent);
      
      if (onSave) {
        onSave(updatedComponent);
      }

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClose();
    } catch (error) {
      setError('Failed to save component');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Component, value: any) => {
    if (!editedComponent) return;
    
    setEditedComponent({
      ...editedComponent,
      [field]: value,
    });
  };

  const handleVariantChange = (variantId: string, field: keyof ComponentVariant, value: any) => {
    if (!editedComponent) return;

    const updatedVariants = editedComponent.variants.map(variant =>
      variant.id === variantId
        ? { ...variant, [field]: value, lastUpdated: new Date().toISOString() }
        : variant
    );

    setEditedComponent({
      ...editedComponent,
      variants: updatedVariants,
    });
  };

  const handleAddVariant = () => {
    if (!editedComponent) return;

    const newVariant: ComponentVariant = {
      id: `${editedComponent.id}-variant-${Date.now()}`,
      name: 'New Variant',
      description: '',
      props: {},
      lastUpdated: new Date().toISOString(),
    };

    setEditedComponent({
      ...editedComponent,
      variants: [...editedComponent.variants, newVariant],
    });
  };

  const handleRemoveVariant = (variantId: string) => {
    if (!editedComponent || editedComponent.variants.length <= 1) return;

    setEditedComponent({
      ...editedComponent,
      variants: editedComponent.variants.filter(v => v.id !== variantId),
    });
  };

  const handleTagsChange = (event: any, newTags: string[]) => {
    handleFieldChange('tags', newTags);
  };

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Edit Component: {editedComponent?.name || 'Loading...'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading component...</Typography>
          </Box>
        ) : editedComponent ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Component Name"
                  value={editedComponent.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={editedComponent.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  multiline
                  rows={2}
                />

                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editedComponent.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    label="Category"
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Autocomplete
                  multiple
                  options={COMMON_TAGS}
                  value={editedComponent.tags}
                  onChange={handleTagsChange}
                  freeSolo
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Add tags..."
                      helperText="Press Enter to add custom tags"
                    />
                  )}
                />

                <TextField
                  fullWidth
                  label="Documentation"
                  value={editedComponent.documentation || ''}
                  onChange={(e) => handleFieldChange('documentation', e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Add component documentation, usage examples, etc."
                />
              </Box>
            </Box>

            <Divider />

            {/* Variants */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Variants ({editedComponent.variants.length})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddVariant}
                  variant="outlined"
                  size="small"
                >
                  Add Variant
                </Button>
              </Box>

              {editedComponent.variants.map((variant, index) => (
                <Box key={variant.id} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      Variant {index + 1}
                    </Typography>
                    {editedComponent.variants.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveVariant(variant.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Variant Name"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                      size="small"
                    />

                    <TextField
                      fullWidth
                      label="Variant Description"
                      value={variant.description || ''}
                      onChange={(e) => handleVariantChange(variant.id, 'description', e.target.value)}
                      size="small"
                    />

                    <TextField
                      fullWidth
                      label="Props (JSON)"
                      value={JSON.stringify(variant.props, null, 2)}
                      onChange={(e) => {
                        try {
                          const props = JSON.parse(e.target.value);
                          handleVariantChange(variant.id, 'props', props);
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      multiline
                      rows={4}
                      size="small"
                      helperText="Enter props as valid JSON"
                      sx={{ fontFamily: 'monospace' }}
                    />

                    <TextField
                      fullWidth
                      label="Screenshot URL"
                      value={variant.screenshot || ''}
                      onChange={(e) => handleVariantChange(variant.id, 'screenshot', e.target.value)}
                      size="small"
                      placeholder="https://example.com/screenshot.png"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={saving || !editedComponent}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
