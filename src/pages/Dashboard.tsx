import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Tabs, 
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Compare as CompareIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { ComponentTypeCard } from '../components/ComponentTypeCard';
import { RepositoryManager } from '../components/RepositoryManager';
import { ComponentComparison } from '../components/ComponentComparison';
import { ComponentDetailView } from '../components/ComponentDetailView';
import { ComponentEditView } from '../components/ComponentEditView';
import { VisualComponentComparison } from '../components/VisualComponentComparison';
import { Component, Repository } from '../types/component';
import { repositoryManager } from '../services/repositoryManager';

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRepository, setSelectedRepository] = useState<string>('all');
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [repoManagerOpen, setRepoManagerOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [editViewOpen, setEditViewOpen] = useState(false);
  const [visualComparisonOpen, setVisualComparisonOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentName, setSelectedComponentName] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
    loadComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRepositories = () => {
    const repos = repositoryManager.getAllRepositories();
    setRepositories(repos);
  };

  const loadComponents = () => {
    if (selectedRepository === 'all') {
      const allComponents = repositoryManager.getAllComponents();
      setComponents(allComponents);
    } else {
      const library = repositoryManager.getComponentLibrary(selectedRepository);
      setComponents(library?.components || []);
    }
  };

  useEffect(() => {
    loadComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepository]);

  const getRepositoryIdFromComponentId = (componentId: string): string | null => {
    const idx = componentId.indexOf(':');
    if (idx <= 0) return null;
    return componentId.slice(0, idx);
  };

  const getRepositoryIdsForComponentName = (componentName: string): Set<string> => {
    const repos = new Set<string>();
    const allComponents = repositoryManager.getAllComponents();
    for (const comp of allComponents) {
      if (comp.name !== componentName) continue;
      const repoId = getRepositoryIdFromComponentId(comp.id);
      if (repoId) repos.add(repoId);
    }
    return repos;
  };

  const allCategories = Array.from(new Set(components.map(c => c.category))).sort();
  const allTags = Array.from(new Set(components.flatMap(c => c.tags))).sort();

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || component.tags.includes(selectedTag);
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  const sharedFilteredComponents = showSharedOnly
    ? filteredComponents.filter((component) => {
        const repoIds = getRepositoryIdsForComponentName(component.name);
        return repoIds.size >= 2;
      })
    : filteredComponents;

  // Group components by name/type across all repositories
  const groupedComponents = sharedFilteredComponents.reduce((groups, component) => {
    const componentName = component.name;
    if (!groups[componentName]) {
      groups[componentName] = [];
    }
    groups[componentName].push(component);
    return groups;
  }, {} as Record<string, Component[]>);

  const componentTypes = Object.entries(groupedComponents);

  const handleView = (id: string) => {
    setSelectedComponentId(id);
    setDetailViewOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedComponentId(id);
    setEditViewOpen(true);
  };

  const handleDetailViewClose = () => {
    setDetailViewOpen(false);
    setSelectedComponentId(null);
  };

  const handleEditViewClose = () => {
    setEditViewOpen(false);
    setSelectedComponentId(null);
  };

  const handleComponentSave = (component: Component) => {
    // In a real implementation, this would update the backend
    console.log('Component saved:', component);
    loadComponents(); // Refresh the component list
  };

  const handleEditFromDetail = (componentId: string) => {
    setDetailViewOpen(false);
    setSelectedComponentId(componentId);
    setEditViewOpen(true);
  };

  const handleVisualComparison = (componentName: string) => {
    setSelectedComponentName(componentName);
    setVisualComparisonOpen(true);
  };


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleRepositoryAdded = (repository: Repository) => {
    loadRepositories();
  };

  const handleRepositoryScanned = (repositoryId: string) => {
    loadRepositories();
    loadComponents();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Component Consistency Tracker
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<StorageIcon />}
          onClick={() => setRepoManagerOpen(true)}
        >
          Manage Repositories
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab icon={<DashboardIcon />} label="Components" />
          <Tab icon={<CompareIcon />} label="Comparison" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        {repositories.length === 0 ? (
          <Alert 
            severity="info" 
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setRepoManagerOpen(true)}
              >
                Add Repository
              </Button>
            }
          >
            No repositories added yet. Add local repositories to start comparing components.
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2,
                alignItems: 'center'
              }}>
                <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
                  <InputLabel>Repository</InputLabel>
                  <Select
                    value={selectedRepository}
                    onChange={(e) => setSelectedRepository(e.target.value)}
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
                
                <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
                  <InputLabel>Component Type</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Component Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {allCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
                  <InputLabel>Tag</InputLabel>
                  <Select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    label="Tag"
                  >
                    <MenuItem value="all">All Tags</MenuItem>
                    {allTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showSharedOnly}
                      onChange={(e) => setShowSharedOnly(e.target.checked)}
                    />
                  }
                  label="Shared Names Only"
                  sx={{ flex: '1 1 200px' }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {componentTypes.length} component type{componentTypes.length !== 1 ? 's' : ''} 
                ({filteredComponents.length} total implementations)
                {selectedRepository !== 'all' && (
                  <> from {repositories.find(r => r.id === selectedRepository)?.name}</>
                )}
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {componentTypes.map(([componentName, componentList]) => (
                <ComponentTypeCard
                  key={componentName}
                  componentName={componentName}
                  components={componentList}
                  onView={handleView}
                  onEdit={handleEdit}
                  onVisualComparison={handleVisualComparison}
                />
              ))}
            </Box>
          </>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <ComponentComparison 
          onComponentView={handleView} 
          onVisualComparison={handleVisualComparison}
        />
      </TabPanel>

      <RepositoryManager
        open={repoManagerOpen}
        onClose={() => setRepoManagerOpen(false)}
        onRepositoryAdded={handleRepositoryAdded}
        onRepositoryScanned={handleRepositoryScanned}
      />

      <ComponentDetailView
        componentId={selectedComponentId}
        open={detailViewOpen}
        onClose={handleDetailViewClose}
        onEdit={handleEditFromDetail}
        onCompare={handleVisualComparison}
      />

      <ComponentEditView
        componentId={selectedComponentId}
        open={editViewOpen}
        onClose={handleEditViewClose}
        onSave={handleComponentSave}
      />

      <VisualComponentComparison
        componentName={selectedComponentName}
        open={visualComparisonOpen}
        onClose={() => setVisualComparisonOpen(false)}
      />

    </Container>
  );
};

export default Dashboard;
