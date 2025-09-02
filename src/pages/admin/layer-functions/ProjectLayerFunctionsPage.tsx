// src/pages/admin/layer-functions/ProjectLayerFunctionsPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Functions as FunctionIcon,
    PlayArrow as ExecuteIcon,
    Settings as SettingsIcon,
    Code as CodeIcon,
    Layers as LayersIcon,
} from '@mui/icons-material';
import { getProjects } from '../../../services/projectService';
import { getLayers } from '../../../services/layerService';
import { 
    getFunctions, 
    getProjectLayerFunctions,
    createProjectLayerFunction,
    updateProjectLayerFunction,
    deleteProjectLayerFunction 
} from '../../../services/functionService';
import { Project } from '../../../types/project.types';
import { Layer } from '../../../types/layer.types';
import { LayerFunction, ProjectLayerFunction } from '../../../types/function.types';

const ProjectLayerFunctionsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [functions, setFunctions] = useState<LayerFunction[]>([]);
    const [projectLayerFunctions, setProjectLayerFunctions] = useState<ProjectLayerFunction[]>([]);
    
    const [selectedProject, setSelectedProject] = useState<number | ''>('');
    const [selectedLayer, setSelectedLayer] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedFunction, setSelectedFunction] = useState<ProjectLayerFunction | null>(null);
    const [formData, setFormData] = useState<{
        layer_function: number;
        function_arguments: Record<string, any>;
        enabled: boolean;
        priority: number;
    }>({
        layer_function: 0,
        function_arguments: {},
        enabled: true,
        priority: 1,
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadProjectLayers(selectedProject as number);
            loadProjectLayerFunctions(selectedProject as number);
        }
    }, [selectedProject]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [projectsRes, functionsRes] = await Promise.all([
                getProjects(),
                getFunctions(),
            ]);
            setProjects(projectsRes.results);
            setFunctions(functionsRes.results);
        } catch (err) {
            setError('Failed to load initial data. Please try again.');
            console.error('Error loading initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectLayers = async (projectId: number) => {
        try {
            const layersRes = await getLayers({ project_id: projectId });
            setLayers(layersRes.results);
        } catch (err) {
            console.error('Error loading project layers:', err);
        }
    };

    const loadProjectLayerFunctions = async (projectId: number) => {
        try {
            const res = await getProjectLayerFunctions({ project_id: projectId });
            setProjectLayerFunctions(res.results);
        } catch (err) {
            console.error('Error loading project layer functions:', err);
        }
    };

    const handleAddFunction = async () => {
        if (!selectedProject || !selectedLayer || !formData.layer_function) return;

        try {
            const newFunction = await createProjectLayerFunction({
                project_layer: selectedLayer as number,
                layer_function: formData.layer_function,
                function_arguments: formData.function_arguments,
                enabled: formData.enabled,
                priority: formData.priority,
            });

            setProjectLayerFunctions(prev => [...prev, newFunction]);
            setAddDialogOpen(false);
            setFormData({
                layer_function: 0,
                function_arguments: {},
                enabled: true,
                priority: 1,
            });
            setSuccess('Function assigned successfully.');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to assign function. Please try again.');
            console.error('Error assigning function:', err);
        }
    };

    const handleEditFunction = (func: ProjectLayerFunction) => {
        setSelectedFunction(func);
        setFormData({
            layer_function: func.layer_function,
            function_arguments: func.function_arguments || {},
            enabled: func.enabled,
            priority: func.priority,
        });
        setEditDialogOpen(true);
    };

    const handleUpdateFunction = async () => {
        if (!selectedFunction) return;

        try {
            const updatedFunction = await updateProjectLayerFunction(selectedFunction.id, {
                function_arguments: formData.function_arguments,
                enabled: formData.enabled,
                priority: formData.priority,
            });

            setProjectLayerFunctions(prev => 
                prev.map(f => f.id === selectedFunction.id ? updatedFunction : f)
            );
            setEditDialogOpen(false);
            setSelectedFunction(null);
            setSuccess('Function updated successfully.');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update function. Please try again.');
            console.error('Error updating function:', err);
        }
    };

    const handleDeleteFunction = async (id: number) => {
        if (!confirm('Are you sure you want to remove this function assignment?')) return;

        try {
            await deleteProjectLayerFunction(id);
            setProjectLayerFunctions(prev => prev.filter(f => f.id !== id));
            setSuccess('Function removed successfully.');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to remove function. Please try again.');
            console.error('Error removing function:', err);
        }
    };

    const getLayerName = (layerId: number) => {
        return layers.find(l => l.id === layerId)?.name || `Layer ${layerId}`;
    };

    const getFunctionName = (functionId: number) => {
        return functions.find(f => f.id === functionId)?.name || `Function ${functionId}`;
    };

    const getAvailableFunctions = () => {
        if (!selectedLayer) return functions;
        
        const assignedFunctionIds = projectLayerFunctions
            .filter(plf => plf.project_layer === selectedLayer)
            .map(plf => plf.layer_function);
        
        return functions.filter(f => !assignedFunctionIds.includes(f.id));
    };

    const getProjectLayerFunctionsForProject = () => {
        if (!selectedProject) return [];
        
        return projectLayerFunctions.filter(plf => {
            const layer = layers.find(l => l.id === plf.project_layer);
            return layer && layer.project_layer_group; // Assuming layers have project reference
        });
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" component="h1">
                        Project Layer Functions
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Assign and configure functions for project layers
                    </Typography>
                </Box>
            </Box>

            {/* Project Selection */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Select Project</InputLabel>
                        <Select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name}
                                    <Chip 
                                        label={project.is_active ? 'Active' : 'Inactive'} 
                                        size="small" 
                                        color={project.is_active ? 'success' : 'default'}
                                        sx={{ ml: 1 }}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddDialogOpen(true)}
                        disabled={!selectedProject || layers.length === 0}
                        fullWidth
                    >
                        Assign Function to Layer
                    </Button>
                </Grid>
            </Grid>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Summary Cards */}
            {selectedProject && (
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <LayersIcon color="primary" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{layers.length}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Project Layers
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <FunctionIcon color="secondary" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{functions.length}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Available Functions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <SettingsIcon color="success" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{getProjectLayerFunctionsForProject().length}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Assigned Functions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <ExecuteIcon color="info" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">
                                            {getProjectLayerFunctionsForProject().filter(f => f.enabled).length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Enabled Functions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Functions Table */}
            {selectedProject ? (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Layer</TableCell>
                                <TableCell>Function</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Arguments</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getProjectLayerFunctionsForProject().map((func) => (
                                <TableRow key={func.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {getLayerName(func.project_layer)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {getFunctionName(func.layer_function)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={func.priority}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={func.enabled ? 'Enabled' : 'Disabled'}
                                            size="small"
                                            color={func.enabled ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View arguments">
                                            <Chip
                                                icon={<CodeIcon />}
                                                label={`${Object.keys(func.function_arguments || {}).length} args`}
                                                size="small"
                                                variant="outlined"
                                                clickable
                                            />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditFunction(func)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteFunction(func.id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                    {getProjectLayerFunctionsForProject().length === 0 && (
                        <Box p={4} textAlign="center">
                            <FunctionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">
                                No Functions Assigned
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Assign functions to layers to add custom functionality.
                            </Typography>
                        </Box>
                    )}
                </TableContainer>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <FunctionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Select a Project
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Choose a project from the dropdown above to manage layer functions.
                    </Typography>
                </Paper>
            )}

            {/* Add Function Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Function to Layer</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Layer</InputLabel>
                                <Select
                                    value={selectedLayer}
                                    onChange={(e) => setSelectedLayer(e.target.value)}
                                >
                                    {layers.map((layer) => (
                                        <MenuItem key={layer.id} value={layer.id}>
                                            {layer.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Function</InputLabel>
                                <Select
                                    value={formData.layer_function}
                                    onChange={(e) => setFormData(prev => ({ ...prev, layer_function: e.target.value as number }))}
                                >
                                    {getAvailableFunctions().map((func) => (
                                        <MenuItem key={func.id} value={func.id}>
                                            {func.name}
                                            <Chip 
                                                label={func.function_type} 
                                                size="small" 
                                                sx={{ ml: 1 }}
                                            />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Priority"
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                fullWidth
                                inputProps={{ min: 1, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.enabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                                    />
                                }
                                label="Enabled"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Function Arguments (JSON)
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={JSON.stringify(formData.function_arguments, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const args = JSON.parse(e.target.value);
                                        setFormData(prev => ({ ...prev, function_arguments: args }));
                                    } catch {
                                        // Invalid JSON, ignore
                                    }
                                }}
                                InputProps={{ sx: { fontFamily: 'monospace' } }}
                                helperText="Configure function-specific arguments"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleAddFunction}
                        variant="contained"
                        disabled={!selectedLayer || !formData.layer_function}
                    >
                        Assign Function
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Function Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Function Assignment</DialogTitle>
                <DialogContent>
                    {selectedFunction && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Priority"
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                    fullWidth
                                    inputProps={{ min: 1, max: 100 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.enabled}
                                            onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                                        />
                                    }
                                    label="Enabled"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Function Arguments (JSON)
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={JSON.stringify(formData.function_arguments, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const args = JSON.parse(e.target.value);
                                            setFormData(prev => ({ ...prev, function_arguments: args }));
                                        } catch {
                                            // Invalid JSON, ignore
                                        }
                                    }}
                                    InputProps={{ sx: { fontFamily: 'monospace' } }}
                                    helperText="Configure function-specific arguments"
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleUpdateFunction}
                        variant="contained"
                    >
                        Update Function
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectLayerFunctionsPage;