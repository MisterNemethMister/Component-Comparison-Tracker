import React from 'react';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';

export interface TestCardProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function TestCard({ 
  title = 'Test Card', 
  description = 'This is a simple test card component',
  actionLabel = 'Learn More',
  onAction
}: TestCardProps) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onAction}>{actionLabel}</Button>
      </CardActions>
    </Card>
  );
}
