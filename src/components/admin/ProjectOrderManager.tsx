import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    TextField,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Badge
} from '@mui/material';
import {
    DragIndicator,
    Visibility,
    Preview,
    Save,
    Refresh,
    ExpandMore,
    Category,
    CalendarToday,
    SortByAlpha,
    FilterList,
    ViewModule,
    ViewList,
    Folder,
    FolderOpen,
    Label
} from '@mui/icons-material';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DraggableProvided,
    DraggableStateSnapshot,
    DroppableProvided
} from '@hello-pangea/dnd';
import { getProjects } from '../../services/projectService';
import { getClients } from '../../services/clientService';
import { Client, Project } from '../../types';

interface ProjectOrderItem {
    id: number;
    name: string;
    description?: string;
    thumbnail?: string;
    category?: string;
    lastModified: Date;
    isVisible: boolean;
    order: number;
    groupId?: string;
}

interface ProjectGroup {
    id: string;
    name: string;
    color: string;
    projects: ProjectOrderItem[];
    collapsed: boolean;
    order: number;
}

interface GroupingOption {
    id: string;
    name: string;
    description: string;
    groupBy: (projects: ProjectOrderItem[]) => ProjectGroup[];
}

const GROUPING_OPTIONS: GroupingOption[] = [
    {
        id: 'none',
        name: 'No Grouping',
        description: 'Show all projects in a single list',
        groupBy: (projects) => [{
            id: 'all',
            name: 'All Projects',
            color: '#1976d2',
            projects,
            collapsed: false,
            order: 0
        }]
    },
    {
        id: 'category',
        name: 'By Category',
        description: 'Group projects by their category',
        groupBy: (projects) => {
            const groups = new Map<string, ProjectOrderItem[]>();
            projects.forEach(project => {
                const category = project.category || 'Uncategorized';
                if (!groups.has(category)) {
                    groups.set(category, []);
                }
                groups.get(category)!.push(project);
            });
            
            return Array.from(groups.entries()).map(([category, projects], index) => ({
                id: category.toLowerCase().replace(/\s+/g, '_'),
                name: category,
                color: ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2'][index % 5],
                projects,
                collapsed: false,
                order: index
            }));
        }
    },
    {
        id: 'date',
        name: 'By Creation Date',
        description: 'Group projects by when they were created',
        groupBy: (projects) => {
            const now = new Date();
            const groups = new Map<string, ProjectOrderItem[]>();
            
            projects.forEach(project => {
                const daysDiff = Math.floor((now.getTime() - project.lastModified.getTime()) / (1000 * 60 * 60 * 24));
                let groupName: string;
                
                if (daysDiff < 7) groupName = 'This Week';
                else if (daysDiff < 30) groupName = 'This Month';
                else if (daysDiff < 90) groupName = 'Last 3 Months';
                else groupName = 'Older';
                
                if (!groups.has(groupName)) {
                    groups.set(groupName, []);
                }
                groups.get(groupName)!.push(project);
            });
            
            const orderMap = { 'This Week': 0, 'This Month': 1, 'Last 3 Months': 2, 'Older': 3 };
            
            return Array.from(groups.entries()).map(([period, projects]) => ({
                id: period.toLowerCase().replace(/\s+/g, '_'),
                name: period,
                color: ['#4caf50', '#2196f3', '#ff9800', '#9e9e9e'][orderMap[period as keyof typeof orderMap] || 3],
                projects,
                collapsed: false,
                order: orderMap[period as keyof typeof orderMap] || 3
            }));
        }
    }
];

interface ProjectOrderManagerProps {
    clientId: number;
    onOrderChange?: (orderedProjects: ProjectOrderItem[]) => void;
}

const ProjectOrderManager: React.FC<ProjectOrderManagerProps> = ({
    clientId,
    onOrderChange
}) => {
    const [projects, setProjects] = useState<ProjectOrderItem[]>([]);
    const [originalProjects, setOriginalProjects] = useState<ProjectOrderItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [groups, setGroups] = useState<ProjectGroup[]>([]);
    const [selectedGrouping, setSelectedGrouping] = useState<string>('none');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [previewMode, setPreviewMode] = useState(false);
    const [previewDialog, setPreviewDialog] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (clientId) {
            loadClientProjects();
        }
    }, [clientId]);

    useEffect(() => {
        updateGroups();
    }, [projects, selectedGrouping]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const clientsRes = await getClients();
            setClients(clientsRes.results || []);
        } catch (err) {
            setError('Failed to load clients');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadClientProjects = async () => {
        if (!clientId) return;
        
        setLoading(true);
        try {
            const [projectsRes, clientsRes] = await Promise.all([
                getProjects(),
                getClients()
            ]);
            
            const client = clientsRes.results.find((c: Client) => c.id === clientId);
            setSelectedClient(client || null);
            
            // Transform projects to order items with mock data
            const projectOrderItems: ProjectOrderItem[] = (projectsRes.results || []).map((project: Project, index: number) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                thumbnail: project.thumbnail,
                category: ['Maps', 'Analytics', 'Planning', 'Survey'][Math.floor(Math.random() * 4)],
                lastModified: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
                isVisible: Math.random() > 0.2,
                order: index
            }));
            
            setProjects(projectOrderItems);
            setOriginalProjects([...projectOrderItems]);
        } catch (err) {
            setError('Failed to load client projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateGroups = () => {
        const groupingOption = GROUPING_OPTIONS.find(opt => opt.id === selectedGrouping);
        if (groupingOption) {
            const newGroups = groupingOption.groupBy(projects);
            setGroups(newGroups.sort((a, b) => a.order - b.order));
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;

        if (source.droppableId === destination.droppableId) {
            // Reordering within the same group
            const groupIndex = groups.findIndex(g => g.id === source.droppableId);
            if (groupIndex === -1) return;

            const group = groups[groupIndex];
            const reorderedProjects = Array.from(group.projects);
            const [movedProject] = reorderedProjects.splice(source.index, 1);
            reorderedProjects.splice(destination.index, 0, movedProject);

            // Update order values
            reorderedProjects.forEach((project, index) => {
                project.order = index;
            });

            const newGroups = [...groups];
            newGroups[groupIndex] = { ...group, projects: reorderedProjects };
            setGroups(newGroups);

            // Update main projects array
            const allProjects = newGroups.flatMap(g => g.projects);
            setProjects(allProjects);
            setHasChanges(true);
        } else {
            // Moving between groups
            const sourceGroupIndex = groups.findIndex(g => g.id === source.droppableId);
            const destGroupIndex = groups.findIndex(g => g.id === destination.droppableId);
            
            if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

            const sourceGroup = groups[sourceGroupIndex];
            const destGroup = groups[destGroupIndex];
            
            const sourceProjects = Array.from(sourceGroup.projects);
            const destProjects = Array.from(destGroup.projects);
            
            const [movedProject] = sourceProjects.splice(source.index, 1);
            destProjects.splice(destination.index, 0, movedProject);

            const newGroups = [...groups];
            newGroups[sourceGroupIndex] = { ...sourceGroup, projects: sourceProjects };
            newGroups[destGroupIndex] = { ...destGroup, projects: destProjects };
            setGroups(newGroups);

            const allProjects = newGroups.flatMap(g => g.projects);
            setProjects(allProjects);
            setHasChanges(true);
        }
    };

    const handleVisibilityToggle = (projectId: number) => {
        setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, isVisible: !p.isVisible } : p
        ));
        setHasChanges(true);
    };

    const handleGroupCollapse = (groupId: string) => {
        setGroups(prev => prev.map(g => 
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            onOrderChange?.(projects);
            setOriginalProjects([...projects]);
            setHasChanges(false);
        } catch (err) {
            setError('Failed to save project order');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setProjects([...originalProjects]);
        setHasChanges(false);
        updateGroups();
    };

    const handlePreview = () => {
        setPreviewDialog(true);
    };

    const renderProjectCard = (project: ProjectOrderItem, provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            sx={{
                mb: 1,
                opacity: project.isVisible ? (snapshot.isDragging ? 0.7 : 1) : 0.5,
                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper'
            }}
        >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box {...provided.dragHandleProps} sx={{ cursor: 'grab' }}>
                        <DragIndicator color="action" />
                    </Box>
                    
                    {project.thumbnail && (
                        <CardMedia
                            component="img"
                            sx={{ width: 50, height: 50, borderRadius: 1 }}
                            image={project.thumbnail}
                            alt={project.name}
                        />
                    )}
                    
                    <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6" sx={{ opacity: project.isVisible ? 1 : 0.6 }}>
                                {project.name}
                            </Typography>
                            {project.category && (
                                <Chip size="small" label={project.category} />
                            )}
                        </Box>
                        {project.description && (
                            <Typography variant="body2" color="text.secondary">
                                {project.description}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            Modified: {project.lastModified.toLocaleDateString()}
                        </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={project.isVisible}
                                    onChange={() => handleVisibilityToggle(project.id)}
                                />
                            }
                            label="Visible"
                            sx={{ mr: 1 }}
                        />
                        <IconButton size="small">
                            <Visibility />
                        </IconButton>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const renderGroup = (group: ProjectGroup) => (
        <Paper key={group.id} sx={{ mb: 2, overflow: 'hidden' }}>
            <Accordion expanded={!group.collapsed} onChange={() => handleGroupCollapse(group.id)}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Avatar sx={{ bgcolor: group.color, width: 32, height: 32 }}>
                            {group.projects.length}
                        </Avatar>
                        <Typography variant="h6">{group.name}</Typography>
                        <Box flexGrow={1} />
                        <Chip 
                            size="small" 
                            label={`${group.projects.filter(p => p.isVisible).length}/${group.projects.length} visible`} 
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Droppable droppableId={group.id}>
                        {(provided: DroppableProvided) => (
                            <Box ref={provided.innerRef} {...provided.droppableProps}>
                                {group.projects.map((project, index) => (
                                    <Draggable
                                        key={project.id}
                                        draggableId={project.id.toString()}
                                        index={index}
                                    >
                                        {(provided, snapshot) => 
                                            renderProjectCard(project, provided, snapshot)
                                        }
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </AccordionDetails>
            </Accordion>
        </Paper>
    );

    const renderClientPreview = () => (
        <Box>
            <Typography variant="h6" gutterBottom>Client View Preview</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                This is how the projects will appear to {selectedClient?.name}:
            </Typography>
            
            <Box sx={{ maxHeight: '60vh', overflow: 'auto', border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                {groups.map(group => (
                    <Box key={group.id} mb={3}>
                        {selectedGrouping !== 'none' && (
                            <Typography variant="h6" color={group.color} gutterBottom>
                                {group.name}
                            </Typography>
                        )}
                        
                        <Grid container spacing={2}>
                            {group.projects
                                .filter(project => project.isVisible)
                                .map(project => (
                                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="h6" noWrap>
                                                    {project.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.description}
                                                </Typography>
                                                {project.category && (
                                                    <Chip size="small" label={project.category} sx={{ mt: 1 }} />
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                        </Grid>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Project Order Manager</Typography>
                <Box display="flex" gap={1}>
                    {hasChanges && (
                        <Button variant="outlined" onClick={handleReset}>
                            Reset
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Preview />}
                        onClick={handlePreview}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={!hasChanges || loading}
                    >
                        Save Order
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {hasChanges && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    You have unsaved changes. Don't forget to save your project order.
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6">
                            Ordering projects for: {selectedClient?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Drag and drop to reorder projects
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Group By</InputLabel>
                            <Select
                                value={selectedGrouping}
                                onChange={(e) => setSelectedGrouping(e.target.value)}
                                label="Group By"
                            >
                                {GROUPING_OPTIONS.map(option => (
                                    <MenuItem key={option.id} value={option.id}>
                                        <Box>
                                            <Typography variant="body2">{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                        <FormControl>
                            <RadioGroup
                                row
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                            >
                                <FormControlLabel 
                                    value="list" 
                                    control={<Radio />} 
                                    label={<ViewList />}
                                />
                                <FormControlLabel 
                                    value="grid" 
                                    control={<Radio />} 
                                    label={<ViewModule />}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={loadClientProjects}
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {projects.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                        {groups.map(group => renderGroup(group))}
                    </Box>
                </DragDropContext>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No projects found for this client
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Assign some projects to this client to start organizing them
                    </Typography>
                </Paper>
            )}

            <Dialog
                open={previewDialog}
                onClose={() => setPreviewDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Client View Preview</DialogTitle>
                <DialogContent>
                    {renderClientPreview()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialog(false)}>Close</Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                        Save and Apply
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectOrderManager;