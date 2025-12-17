import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Repository } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';
import { FigmaSettings } from './FigmaSettings';
import { Tabs, Tab } from '@mui/material';

interface RepositoryManagerProps {
  open: boolean;
  onClose: () => void;
  onRepositoryAdded?: (repository: Repository) => void;
  onRepositoryScanned?: (repositoryId: string) => void;
}

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({
  open,
  onClose,
  onRepositoryAdded,
  onRepositoryScanned,
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [newRepoPath, setNewRepoPath] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningRepo, setScanningRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [repoType, setRepoType] = useState<'local' | 'figma'>('local');
  const [showFigmaSettings, setShowFigmaSettings] = useState(false);

  useEffect(() => {
    if (open) {
      loadRepositories();
    }
  }, [open]);

  const loadRepositories = () => {
    const repos = repositoryManager.getAllRepositories();
    setRepositories(repos);
  };

  const handleAddRepository = async () => {
    if (!newRepoPath.trim()) {
      setError(repoType === 'figma' ? 'Figma URL is required' : 'Repository path is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let repository: Repository;
      
      if (repoType === 'figma') {
        repository = await repositoryManager.addFigmaRepository(
          newRepoPath.trim(),
          newRepoName.trim() || undefined,
          newRepoDescription.trim() || undefined
        );
      } else {
        repository = await repositoryManager.addRepository(
          newRepoPath.trim(),
          newRepoName.trim() || undefined,
          newRepoDescription.trim() || undefined
        );
      }

      setRepositories(prev => [...prev, repository]);
      setNewRepoPath('');
      setNewRepoName('');
      setNewRepoDescription('');
      setShowAddForm(false);
      
      if (onRepositoryAdded) {
        onRepositoryAdded(repository);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRepository = (repositoryId: string) => {
    const success = repositoryManager.removeRepository(repositoryId);
    if (success) {
      setRepositories(prev => prev.filter(repo => repo.id !== repositoryId));
    }
  };

  const handleScanRepository = async (repositoryId: string) => {
    setScanningRepo(repositoryId);
    setError(null);

    try {
      await repositoryManager.scanRepository(repositoryId);
      loadRepositories(); // Refresh to show updated component count
      
      if (onRepositoryScanned) {
        onRepositoryScanned(repositoryId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan repository');
    } finally {
      setScanningRepo(null);
    }
  };

  const handleSelectFolder = () => {
    // In a real app, you'd use a file picker dialog
    // For now, we'll just show an alert with instructions
    alert('Please enter the full path to your local repository in the text field above.\n\nExample: /Users/username/projects/my-component-library');
  };

  const formatLastScanned = (lastScanned?: string) => {
    if (!lastScanned) return 'Never';
    return new Date(lastScanned).toLocaleDateString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Repository Manager
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outlined"
            size="small"
          >
            Add Repository
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {showAddForm && (
          <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Add New Repository
              </Typography>
              {repoType === 'figma' && (
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowFigmaSettings(true)}
                >
                  Configure API Token
                </Button>
              )}
            </Box>
            
            <Tabs value={repoType} onChange={(e, v) => setRepoType(v)} sx={{ mb: 2 }}>
              <Tab label="Local Repository" value="local" />
              <Tab label="Figma File" value="figma" />
            </Tabs>

            {repoType === 'local' ? (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Repository Path"
                  value={newRepoPath}
                  onChange={(e) => setNewRepoPath(e.target.value)}
                  placeholder="/path/to/your/repository"
                  helperText="Full path to your local repository"
                />
                <Button
                  startIcon={<FolderIcon />}
                  onClick={handleSelectFolder}
                  variant="outlined"
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Browse
                </Button>
              </Box>
            ) : (
              <TextField
                fullWidth
                label="Figma File URL"
                value={newRepoPath}
                onChange={(e) => setNewRepoPath(e.target.value)}
                placeholder="https://www.figma.com/design/..."
                helperText="Paste the full URL of your Figma file"
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label="Repository Name (Optional)"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Leave empty to use the folder name"
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              value={newRepoDescription}
              onChange={(e) => setNewRepoDescription(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleAddRepository}
                variant="contained"
                disabled={loading || !newRepoPath.trim()}
              >
                {loading ? <CircularProgress size={20} /> : 'Add Repository'}
              </Button>
              <Button onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Repositories ({repositories.length})
        </Typography>

        {repositories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No repositories added yet. Click "Add Repository" to get started.
            </Typography>
          </Box>
        ) : (
          <List>
            {repositories.map((repo, index) => (
              <React.Fragment key={repo.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{repo.name}</Typography>
                        <Chip
                          label={repo.type}
                          size="small"
                          color={repo.type === 'local' ? 'primary' : 'secondary'}
                        />
                        {repo.componentCount !== undefined && (
                          <Chip
                            label={`${repo.componentCount} components`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {repo.path}
                        </Typography>
                        {repo.description && (
                          <Typography variant="body2" color="text.secondary">
                            {repo.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Last scanned: {formatLastScanned(repo.lastScanned)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleScanRepository(repo.id)}
                        disabled={scanningRepo === repo.id}
                        title="Scan for components"
                      >
                        {scanningRepo === repo.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <RefreshIcon />
                        )}
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveRepository(repo.id)}
                        color="error"
                        title="Remove repository"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < repositories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <FigmaSettings
        open={showFigmaSettings}
        onClose={() => setShowFigmaSettings(false)}
      />
    </Dialog>
  );
};
