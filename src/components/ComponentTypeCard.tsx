import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { Component } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

interface ComponentTypeCardProps {
  componentName: string;
  components: Component[];
  onView: (componentId: string) => void;
  onEdit: (componentId: string) => void;
  onVisualComparison: (componentName: string) => void;
}

export const ComponentTypeCard: React.FC<ComponentTypeCardProps> = ({
  componentName,
  components,
  onView,
  onEdit,
  onVisualComparison,
}) => {
  const getRepositoryIdFromComponentId = (componentId: string): string | null => {
    const idx = componentId.indexOf(':');
    if (idx <= 0) return null;
    return componentId.slice(0, idx);
  };

  const getRepositoryInitialsFromName = (repoName: string) => {
    const parts = repoName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'DM';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getRepositoryColorFromName = (repoName: string) => {
    let hash = 0;
    for (let i = 0; i < repoName.length; i++) {
      hash = repoName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 45%)`;
  };

  const getRepositoryName = (component: Component) => {
    const repoId = getRepositoryIdFromComponentId(component.id);
    if (repoId) {
      const repo = repositoryManager.getRepository(repoId);
      if (repo?.name) return repo.name;
    }
    if (component.id.includes('ztx-frontend')) return 'ZTX Frontend';
    if (component.id.includes('kumo-kit')) return 'Kumo Kit';
    if (component.id.includes('stratus')) return 'Stratus';
    if (component.id.includes('component-consistency-tracker')) return 'Component Tracker';
    return 'Unknown Repository';
  };

  const getRepositoryColor = (repoName: string) => {
    switch (repoName) {
      case 'ZTX Frontend': return '#1976d2';
      case 'Kumo Kit': return '#9c27b0';
      case 'Stratus': return '#f57c00';
      case 'Component Tracker': return '#388e3c';
      default: return getRepositoryColorFromName(repoName);
    }
  };

  const getRepositoryInitials = (repoName: string) => {
    switch (repoName) {
      case 'ZTX Frontend': return 'ZTX';
      case 'Kumo Kit': return 'KK';
      case 'Stratus': return 'ST';
      case 'Component Tracker': return 'CT';
      default: return getRepositoryInitialsFromName(repoName);
    }
  };

  // Get unique tags
  const allTags = Array.from(new Set(components.flatMap(c => c.tags)));
  
  // Get the most recent component for primary display
  const primaryComponent = components.reduce((latest, current) => 
    new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest
  );

  // Group components by repository
  const repositoryGroups = components.reduce((groups, component) => {
    const repoName = getRepositoryName(component);
    if (!groups[repoName]) {
      groups[repoName] = [];
    }
    groups[repoName].push(component);
    return groups;
  }, {} as Record<string, Component[]>);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={componentName}
          >
            {componentName}
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {primaryComponent.description || 'No description for this component'}
        </Typography>

        {/* Spacer to push bottom content down */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Repository Avatars */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Repositories:
          </Typography>

          {/* Repository Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(repositoryGroups).map(([repoName, repoComponents]) => (
              <Box key={repoName} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: getRepositoryColor(repoName),
                    width: 20,
                    height: 20,
                    fontSize: '0.6rem',
                  }}
                >
                  {getRepositoryInitials(repoName)}
                </Avatar>
                <Typography variant="body2">
                  {repoName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({repoComponents.reduce((sum, c) => sum + c.variants.length, 0)} variants)
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Tags */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Common tags:
          </Typography>
          {allTags.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {allTags.slice(0, 6).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {allTags.length > 6 && (
                <Chip
                  label={`+${allTags.length - 6} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>
          )}
        </Box>
      </CardContent>

      <Divider />

      {/* Actions */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onView(primaryComponent.id)}
            variant="outlined"
          >
            View
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(primaryComponent.id)}
            variant="outlined"
          >
            Edit
          </Button>
        </Box>
        {components.length > 1 && (
          <Button
            size="small"
            startIcon={<CompareIcon />}
            onClick={() => onVisualComparison(componentName)}
            variant="contained"
            color="primary"
          >
            Compare
          </Button>
        )}
      </Box>
    </Card>
  );
};
