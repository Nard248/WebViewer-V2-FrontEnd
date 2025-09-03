import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    IconButton,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Grid,
    Paper,
    Toolbar,
    Checkbox,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert,
    InputAdornment,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DraggableProvided,
    DraggableStateSnapshot,
    DroppableProvided
} from '@hello-pangea/dnd';
import {
    Visibility,
    Edit,
    Delete,
    Search,
    FilterList,
    AddCircle,
    RemoveCircle,
    AccessTime,
    Lock,
    LockOpen,
    CheckCircle,
    Cancel,
    SaveAlt,
    ContentCopy
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getProjects } from '../../../services/projectService';
import { getClients, createClientProject, updateClientProject, deleteClientProject } from '../../../services/clientService';
import { Client, Project, ClientProject } from '../../../types';

interface ProjectCard {
    id: number;
    name: string;
    description?: string;
    thumbnail?: string;
    isAssigned: boolean;
    clientProjectId?: number;
    accessLevel?: 'view' | 'edit' | 'full';
    expiresAt?: Date | null;
    isActive?: boolean;
}

interface BulkOperation {
    projectIds: number[];
    action: 'assign' | 'remove' | 'update-access' | 'set-expiration';
    accessLevel?: 'view' | 'edit' | 'full';
    expiresAt?: Date | null;
}

const ClientProjectAssignmentPage: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
    const [availableProjects, setAvailableProjects] = useState<ProjectCard[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<ProjectCard[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
    const [bulkOperationDialog, setBulkOperationDialog] = useState(false);
    const [bulkAccessLevel, setBulkAccessLevel] = useState<'view' | 'edit' | 'full'>('view');
    const [bulkExpiresAt, setBulkExpiresAt] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            loadClientProjects();
        }
    }, [selectedClient]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [projectsRes, clientsRes] = await Promise.all([
                getProjects(),
                getClients()
            ]);
            setProjects(projectsRes.results || []);
            setClients(clientsRes.results || []);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadClientProjects = async () => {
        if (!selectedClient) return;
        
        setLoading(true);
        try {
            const response = await getClients();
            const client = response.results.find((c: Client) => c.id === selectedClient);
            
            if (client) {
                const assigned = projects.filter(p => 
                    clientProjects.some(cp => cp.project === p.id && cp.client === selectedClient)
                ).map(p => {
                    const cp = clientProjects.find(cpr => cpr.project === p.id);
                    return {
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        thumbnail: p.thumbnail,
                        isAssigned: true,
                        clientProjectId: cp?.id,
                        accessLevel: 'view' as const,
                        expiresAt: cp?.expires_at ? new Date(cp.expires_at) : null,
                        isActive: cp?.is_active
                    };
                });

                const available = projects.filter(p => 
                    !clientProjects.some(cp => cp.project === p.id && cp.client === selectedClient)
                ).map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    thumbnail: p.thumbnail,
                    isAssigned: false
                }));

                setAssignedProjects(assigned);
                setAvailableProjects(available);
            }
        } catch (err) {
            setError('Failed to load client projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || !selectedClient) return;

        const { source, destination, draggableId } = result;
        const projectId = parseInt(draggableId);

        if (source.droppableId === destination.droppableId) {
            const items = source.droppableId === 'available' ? availableProjects : assignedProjects;
            const reordered = Array.from(items);
            const [removed] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, removed);

            if (source.droppableId === 'available') {
                setAvailableProjects(reordered);
            } else {
                setAssignedProjects(reordered);
            }
        } else {
            if (source.droppableId === 'available' && destination.droppableId === 'assigned') {
                const project = availableProjects.find(p => p.id === projectId);
                if (project) {
                    try {
                        const response = await createClientProject({
                            client: selectedClient,
                            project: projectId,
                            is_active: true
                        });
                        
                        const newAssigned = {
                            ...project,
                            isAssigned: true,
                            clientProjectId: response.id,
                            accessLevel: 'view' as const,
                            isActive: true
                        };

                        setAvailableProjects(prev => prev.filter(p => p.id !== projectId));
                        setAssignedProjects(prev => [...prev, newAssigned]);
                    } catch (err) {
                        setError('Failed to assign project');
                        console.error(err);
                    }
                }
            } else if (source.droppableId === 'assigned' && destination.droppableId === 'available') {
                const project = assignedProjects.find(p => p.id === projectId);
                if (project && project.clientProjectId) {
                    try {
                        await deleteClientProject(project.clientProjectId);
                        
                        const newAvailable = {
                            id: project.id,
                            name: project.name,
                            description: project.description,
                            thumbnail: project.thumbnail,
                            isAssigned: false
                        };

                        setAssignedProjects(prev => prev.filter(p => p.id !== projectId));
                        setAvailableProjects(prev => [...prev, newAvailable]);
                    } catch (err) {
                        setError('Failed to remove project');
                        console.error(err);
                    }
                }
            }
        }
    };

    const handleAccessLevelChange = async (projectId: number, newLevel: 'view' | 'edit' | 'full') => {
        const project = assignedProjects.find(p => p.id === projectId);
        if (project && project.clientProjectId) {
            try {
                await updateClientProject(project.clientProjectId, {
                    is_active: project.isActive
                });
                
                setAssignedProjects(prev => prev.map(p => 
                    p.id === projectId ? { ...p, accessLevel: newLevel } : p
                ));
            } catch (err) {
                setError('Failed to update access level');
                console.error(err);
            }
        }
    };

    const handleExpirationChange = async (projectId: number, newDate: Date | null) => {
        const project = assignedProjects.find(p => p.id === projectId);
        if (project && project.clientProjectId) {
            try {
                await updateClientProject(project.clientProjectId, {
                    expires_at: newDate ? newDate.toISOString() : undefined
                });
                
                setAssignedProjects(prev => prev.map(p => 
                    p.id === projectId ? { ...p, expiresAt: newDate } : p
                ));
            } catch (err) {
                setError('Failed to update expiration date');
                console.error(err);
            }
        }
    };

    const handleBulkOperation = async () => {
        if (selectedProjects.size === 0) return;

        setLoading(true);
        try {
            const promises = Array.from(selectedProjects).map(async (projectId) => {
                const project = assignedProjects.find(p => p.id === projectId);
                if (project && project.clientProjectId) {
                    return updateClientProject(project.clientProjectId, {
                        expires_at: bulkExpiresAt ? bulkExpiresAt.toISOString() : undefined
                    });
                }
            });

            await Promise.all(promises);
            
            setAssignedProjects(prev => prev.map(p => 
                selectedProjects.has(p.id) 
                    ? { ...p, accessLevel: bulkAccessLevel, expiresAt: bulkExpiresAt }
                    : p
            ));
            
            setSelectedProjects(new Set());
            setBulkOperationDialog(false);
        } catch (err) {
            setError('Failed to perform bulk operation');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAvailable = availableProjects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredAssigned = assignedProjects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && p.isActive) ||
            (filterStatus === 'expired' && p.expiresAt && new Date(p.expiresAt) < new Date());
        return matchesSearch && matchesFilter;
    });

    const renderProjectCard = (project: ProjectCard, provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            sx={{
                mb: 2,
                opacity: snapshot.isDragging ? 0.5 : 1,
                bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                cursor: 'grab'
            }}
        >
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        {project.isAssigned && (
                            <Checkbox
                                checked={selectedProjects.has(project.id)}
                                onChange={(e) => {
                                    const newSelected = new Set(selectedProjects);
                                    if (e.target.checked) {
                                        newSelected.add(project.id);
                                    } else {
                                        newSelected.delete(project.id);
                                    }
                                    setSelectedProjects(newSelected);
                                }}
                            />
                        )}
                        {project.thumbnail && (
                            <CardMedia
                                component="img"
                                sx={{ width: 60, height: 60, borderRadius: 1 }}
                                image={project.thumbnail}
                                alt={project.name}
                            />
                        )}
                        <Box>
                            <Typography variant="h6">{project.name}</Typography>
                            {project.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {project.description}
                                </Typography>
                            )}
                            {project.isAssigned && (
                                <Box display="flex" gap={1} mt={1}>
                                    <Chip
                                        size="small"
                                        icon={project.isActive ? <CheckCircle /> : <Cancel />}
                                        label={project.isActive ? 'Active' : 'Inactive'}
                                        color={project.isActive ? 'success' : 'default'}
                                    />
                                    {project.expiresAt && (
                                        <Chip
                                            size="small"
                                            icon={<AccessTime />}
                                            label={`Expires: ${new Date(project.expiresAt).toLocaleDateString()}`}
                                            color={new Date(project.expiresAt) < new Date() ? 'error' : 'default'}
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    {project.isAssigned && (
                        <Box display="flex" gap={1}>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select
                                    value={project.accessLevel}
                                    onChange={(e) => handleAccessLevelChange(project.id, e.target.value as 'view' | 'edit' | 'full')}
                                >
                                    <MenuItem value="view">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Visibility fontSize="small" />
                                            View
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="edit">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Edit fontSize="small" />
                                            Edit
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="full">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Lock fontSize="small" />
                                            Full
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <Tooltip title="Set Expiration">
                                <IconButton size="small">
                                    <AccessTime />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={async () => {
                                        if (project.clientProjectId) {
                                            await deleteClientProject(project.clientProjectId);
                                            await loadClientProjects();
                                        }
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Client Project Assignment
                </Typography>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Select Client</InputLabel>
                                <Select
                                    value={selectedClient || ''}
                                    onChange={(e) => setSelectedClient(e.target.value as number)}
                                    label="Select Client"
                                >
                                    {clients.map(client => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Filter Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
                                    label="Filter Status"
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="expired">Expired</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {selectedClient && (
                    <>
                        {selectedProjects.size > 0 && (
                            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography>
                                        {selectedProjects.size} project(s) selected
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => setBulkOperationDialog(true)}
                                        >
                                            Bulk Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setSelectedProjects(new Set())}
                                        >
                                            Clear Selection
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        )}

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                                        <Typography variant="h6" gutterBottom>
                                            Available Projects
                                        </Typography>
                                        <Droppable droppableId="available">
                                            {(provided: DroppableProvided) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    sx={{ minHeight: 200 }}
                                                >
                                                    {filteredAvailable.map((project, index) => (
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
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                                        <Typography variant="h6" gutterBottom>
                                            Assigned Projects
                                        </Typography>
                                        <Droppable droppableId="assigned">
                                            {(provided: DroppableProvided) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    sx={{ minHeight: 200 }}
                                                >
                                                    {filteredAssigned.map((project, index) => (
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
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DragDropContext>
                    </>
                )}

                <Dialog open={bulkOperationDialog} onClose={() => setBulkOperationDialog(false)}>
                    <DialogTitle>Bulk Edit Projects</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 2, minWidth: 400 }}>
                            <FormControl fullWidth>
                                <InputLabel>Access Level</InputLabel>
                                <Select
                                    value={bulkAccessLevel}
                                    onChange={(e) => setBulkAccessLevel(e.target.value as 'view' | 'edit' | 'full')}
                                    label="Access Level"
                                >
                                    <MenuItem value="view">View Only</MenuItem>
                                    <MenuItem value="edit">Edit</MenuItem>
                                    <MenuItem value="full">Full Access</MenuItem>
                                </Select>
                            </FormControl>
                            <DateTimePicker
                                label="Expiration Date"
                                value={bulkExpiresAt}
                                onChange={(newValue) => setBulkExpiresAt(newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setBulkOperationDialog(false)}>Cancel</Button>
                        <Button onClick={handleBulkOperation} variant="contained">
                            Apply Changes
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default ClientProjectAssignmentPage;