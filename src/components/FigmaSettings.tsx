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
  Alert,
  Link,
} from '@mui/material';
import { figmaService } from '../services/figmaService';

interface FigmaSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const FigmaSettings: React.FC<FigmaSettingsProps> = ({ open, onClose }) => {
  const [apiToken, setApiToken] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (open) {
      const token = figmaService.getApiToken();
      setHasToken(!!token);
      setApiToken(token || '');
    }
  }, [open]);

  const handleSave = () => {
    if (apiToken.trim()) {
      figmaService.setApiToken(apiToken.trim());
      setHasToken(true);
      onClose();
    }
  };

  const handleClear = () => {
    figmaService.setApiToken('');
    setApiToken('');
    setHasToken(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Figma API Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {hasToken && !apiToken && (
            <Alert severity="success">
              Figma API token is configured and saved.
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary">
            To access Figma files, you need a personal access token from Figma.
          </Typography>

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>How to get your Figma API token:</strong>
            </Typography>
            <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
              <li>Go to your Figma account settings</li>
              <li>Navigate to "Personal access tokens"</li>
              <li>Click "Generate new token"</li>
              <li>Give it a name and copy the token</li>
              <li>Paste it below</li>
            </Typography>
            <Link
              href="https://www.figma.com/developers/api#access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 1, display: 'block' }}
            >
              Learn more about Figma API tokens →
            </Link>
          </Box>

          <TextField
            label="Figma API Token"
            type="password"
            fullWidth
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="figd_..."
            helperText="Your token will be stored locally in your browser"
          />

          {hasToken && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleClear}
              size="small"
            >
              Clear Saved Token
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!apiToken.trim()}>
          Save Token
        </Button>
      </DialogActions>
    </Dialog>
  );
};
