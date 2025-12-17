import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Repository } from '../types/component';

interface AdvancedFiltersPanelProps {
  open: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRepository: string;
  onRepositoryChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTag: string;
  onTagChange: (value: string) => void;
  showSharedOnly: boolean;
  onSharedOnlyChange: (value: boolean) => void;
  repositories: Repository[];
  categories: string[];
  tags: string[];
}

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  selectedRepository,
  onRepositoryChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  showSharedOnly,
  onSharedOnlyChange,
  repositories,
  categories,
  tags,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 350,
          p: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Advanced Filters</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Search */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Search
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Box>

        <Divider />

        {/* Repository Filter */}
        <FormControl fullWidth>
          <InputLabel>Repository</InputLabel>
          <Select
            value={selectedRepository}
            onChange={(e) => onRepositoryChange(e.target.value)}
            label="Repository"
          >
            <MenuItem value="all">All Repositories</MenuItem>
            {repositories.map((repo) => (
              <MenuItem key={repo.id} value={repo.id}>
                {repo.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Component Type Filter */}
        <FormControl fullWidth>
          <InputLabel>Component Type</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            label="Component Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tag Filter */}
        <FormControl fullWidth>
          <InputLabel>Tag</InputLabel>
          <Select
            value={selectedTag}
            onChange={(e) => onTagChange(e.target.value)}
            label="Tag"
          >
            <MenuItem value="all">All Tags</MenuItem>
            {tags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Shared Names Only */}
        <FormControlLabel
          control={
            <Switch
              checked={showSharedOnly}
              onChange={(e) => onSharedOnlyChange(e.target.checked)}
            />
          }
          label="Shared Names Only"
        />
      </Box>
    </Drawer>
  );
};
