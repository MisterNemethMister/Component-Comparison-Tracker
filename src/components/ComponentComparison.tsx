import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { ComponentComparison as ComponentComparisonType } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

interface ComponentComparisonProps {
  onComponentSelect?: (componentName: string, repositoryId: string) => void;
  onComponentView?: (componentId: string) => void;
  onVisualComparison?: (componentName: string) => void;
}

export const ComponentComparison: React.FC<ComponentComparisonProps> = ({
  onComponentSelect,
  onComponentView,
  onVisualComparison,
}) => {
  const [comparisons, setComparisons] = useState<ComponentComparisonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = () => {
    setLoading(true);
    try {
      const comparisonData = repositoryManager.compareComponents();
      setComparisons(comparisonData);
    } catch (error) {
      console.error('Failed to load comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComparisons = comparisons.filter(comparison => {
    return true;
  });

  const getConsistencyColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getConsistencyIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <CancelIcon color="error" />;
  };

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleComponentClick = (componentName: string, repositoryId: string) => {
    if (onComponentSelect) {
      onComponentSelect(componentName, repositoryId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analyzing Component Consistency...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (comparisons.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">
          No components found for comparison. Make sure you have added and scanned repositories.
        </Alert>
        <Button 
          variant="contained" 
          onClick={loadComparisons}
          sx={{ mt: 2 }}
        >
          Refresh Analysis
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Component Consistency Analysis
        </Typography>
        <Button variant="outlined" onClick={loadComparisons}>
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Components
              </Typography>
              <Typography variant="h4">
                {filteredComparisons.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                High Consistency
              </Typography>
              <Typography variant="h4" color="success.main">
                {filteredComparisons.filter(c => c.consistencyScore >= 80).length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Needs Attention
              </Typography>
              <Typography variant="h4" color="error.main">
                {filteredComparisons.filter(c => c.consistencyScore < 60).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Component Details
      </Typography>

      {filteredComparisons.map((comparison, index) => (
        <Accordion
          key={comparison.componentName}
          expanded={expandedAccordion === comparison.componentName}
          onChange={handleAccordionChange(comparison.componentName)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {getConsistencyIcon(comparison.consistencyScore)}
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {comparison.componentName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Consistency:
                </Typography>
                <Chip
                  label={`${comparison.consistencyScore}%`}
                  color={getConsistencyColor(comparison.consistencyScore)}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  ({comparison.repositories.filter(r => r.exists).length}/{comparison.repositories.length} repos)
                </Typography>
                {onVisualComparison && comparison.repositories.filter(r => r.exists).length > 1 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVisualComparison(comparison.componentName);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Visual Compare
                  </Button>
                )}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Repository Status
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Repository</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Variants</TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparison.repositories.map((repo) => (
                      <TableRow key={repo.repositoryId}>
                        <TableCell>{repo.repositoryName}</TableCell>
                        <TableCell>
                          {repo.exists ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Present"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<CancelIcon />}
                              label="Missing"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {repo.component?.category || '-'}
                        </TableCell>
                        <TableCell>
                          {repo.component?.variants.length || 0}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {repo.component?.tags.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {repo.component && repo.component.tags.length > 3 && (
                              <Chip
                                label={`+${repo.component.tags.length - 3}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {repo.exists && (
                            <Button
                              size="small"
                              onClick={() => {
                                if (repo.component && onComponentView) {
                                  onComponentView(repo.component.id);
                                } else {
                                  handleComponentClick(comparison.componentName, repo.repositoryId);
                                }
                              }}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {comparison.differences.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Identified Issues
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {comparison.differences.map((difference, idx) => (
                    <Alert key={idx} severity="warning" variant="outlined">
                      {difference}
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
