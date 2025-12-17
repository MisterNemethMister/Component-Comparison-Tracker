import React from 'react';
import { Card, CardContent, Typography, Chip, Box, CardActions, Button } from '@mui/material';
import { Component as ComponentType } from '../types/component';

interface ComponentCardProps {
  component: ComponentType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({ component, onView, onEdit }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {component.name}
        </Typography>
        {component.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {component.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {component.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {component.variants.length} variants • Updated {new Date(component.lastUpdated).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onView(component.id)}>
          View
        </Button>
        <Button size="small" onClick={() => onEdit(component.id)}>
          Edit
        </Button>
      </CardActions>
    </Card>
  );
};

export default ComponentCard;
