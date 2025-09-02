// src/components/admin/ProjectToolsManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
    Chip,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Settings as SettingsIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Build as ToolIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getMapTools, getProjectTools, updateProjectTools } from '../../services/mapService';
import { Project } from '../../types/project.types';
import { MapTool, ProjectTool } from '../../types/map.types';

interface ProjectToolsManagerProps {
    project: Project;
    onUpdate?: () => void;
}

interface ProjectToolConfig extends ProjectTool {
    tool_data?: MapTool;
}

const UI_POSITIONS = [
    { value: 'topright', label: 'Top Right' },
    { value: 'topleft', label: 'Top Left' },
    { value: 'bottomright', label: 'Bottom Right' },
    { value: 'bottomleft', label: 'Bottom Left' },
    { value: 'top', label: 'Top Center' },
    { value: 'bottom', label: 'Bottom Center' },
];

const ProjectToolsManager: React.FC<ProjectToolsManagerProps> = ({ project, onUpdate }) => {
    const [availableTools, setAvailableTools] = useState<MapTool[]>([]);
    const [projectTools, setProjectTools] = useState<ProjectToolConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ProjectToolConfig | null>(null);
    const [pendingChanges, setPendingChanges] = useState(false);

    useEffect(() => {
        loadData();
    }, [project.id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [toolsResponse, projectToolsResponse] = await Promise.all([
                getMapTools({ page_size: 100 }),
                getProjectTools({ project_id: project.id, page_size: 100 }),
            ]);

            setAvailableTools(toolsResponse.results);
            
            // Enrich project tools with tool data
            const enrichedProjectTools = projectToolsResponse.results.map((pt: ProjectTool) => ({
                ...pt,
                tool_data: toolsResponse.results.find(t => t.id === pt.tool),
            }));
            
            setProjectTools(enrichedProjectTools.sort((a, b) => a.display_order - b.display_order));
        } catch (err) {
            setError('Failed to load project tools. Please try again.');
            console.error('Error loading project tools:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(projectTools);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update display_order
        const updatedItems = items.map((item, index) => ({
            ...item,
            display_order: index + 1,
        }));

        setProjectTools(updatedItems);
        setPendingChanges(true);
    };

    const handleToggleEnabled = (toolId: number, enabled: boolean) => {
        setProjectTools(prev => 
            prev.map(pt => 
                pt.id === toolId ? { ...pt, is_enabled: enabled } : pt
            )
        );
        setPendingChanges(true);
    };

    const handleConfigureTool = (tool: ProjectToolConfig) => {
        setSelectedTool(tool);
        setConfigDialogOpen(true);
    };

    const handleSaveToolConfig = () => {
        if (!selectedTool) return;

        setProjectTools(prev => 
            prev.map(pt => 
                pt.id === selectedTool.id ? selectedTool : pt
            )
        );
        setPendingChanges(true);
        setConfigDialogOpen(false);
        setSelectedTool(null);
    };

    const handleRemoveTool = (toolId: number) => {
        setProjectTools(prev => prev.filter(pt => pt.id !== toolId));
        setPendingChanges(true);
    };

    const handleAddTool = async (toolId: number) => {
        const tool = availableTools.find(t => t.id === toolId);
        if (!tool) return;

        // Check if tool is already added
        if (projectTools.some(pt => pt.tool === toolId)) {
            setError('This tool is already added to the project.');
            return;
        }

        const newProjectTool: ProjectToolConfig = {
            id: Date.now(), // Temporary ID
            project: project.id,
            project_name: project.name,
            tool: toolId,
            tool_name: tool.name,
            is_enabled: true,
            display_order: projectTools.length + 1,
            tool_options: tool.default_options,
            custom_position: tool.ui_position,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tool_data: tool,
        };

        setProjectTools(prev => [...prev, newProjectTool]);
        setPendingChanges(true);
        setAddDialogOpen(false);
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        setError(null);

        try {
            const updates = projectTools.map((pt, index) => ({
                tool_id: pt.tool,
                is_enabled: pt.is_enabled,
                display_order: index + 1,
                tool_options: pt.tool_options,
                custom_position: pt.custom_position,
            }));

            await updateProjectTools(project.id, updates);
            
            setSuccess('Project tools updated successfully.');
            setPendingChanges(false);
            onUpdate?.();
            
            // Reload to get proper IDs
            await loadData();
        } catch (err) {
            setError('Failed to save project tools. Please try again.');
            console.error('Error saving project tools:', err);
        } finally {
            setSaving(false);
        }
    };

    const getAvailableTools = () => {
        const usedToolIds = projectTools.map(pt => pt.tool);
        return availableTools.filter(t => !usedToolIds.includes(t.id));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6">
                        Project Tools ({projectTools.length})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Configure which tools are available in this project
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setAddDialogOpen(true)}
                        variant="outlined"
                        disabled={getAvailableTools().length === 0}
                    >
                        Add Tool
                    </Button>
                    {pendingChanges && (
                        <Button
                            startIcon={<SaveIcon />}
                            onClick={handleSaveChanges}
                            variant="contained"
                            disabled={saving}
                        >
                            Save Changes
                        </Button>
                    )}
                </Box>
            </Box>

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

            {/* Tools List */}
            {projectTools.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <ToolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No Tools Configured
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                        Add tools to enable interactive features in this project.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddDialogOpen(true)}
                        disabled={getAvailableTools().length === 0}
                    >
                        Add Your First Tool
                    </Button>
                </Paper>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="project-tools">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {projectTools.map((projectTool, index) => {
                                    const tool = projectTool.tool_data;
                                    if (!tool) return null;

                                    return (
                                        <Draggable
                                            key={projectTool.id}
                                            draggableId={projectTool.id.toString()}
                                            index={index}
                                            isDragDisabled={saving}
                                        >
                                            {(provided, snapshot) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    sx={{
                                                        mb: 2,
                                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                                        transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                                    }}
                                                >
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            {/* Drag Handle */}
                                                            <div {...provided.dragHandleProps}>
                                                                <DragIcon color="action" />
                                                            </div>

                                                            {/* Tool Icon */}
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    fontFamily: 'Material Icons',
                                                                    fontSize: 24,
                                                                    color: 'primary.main',
                                                                }}
                                                            >
                                                                {tool.icon}
                                                            </Box>

                                                            {/* Tool Info */}
                                                            <Box flex={1}>
                                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                                        {tool.name}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={tool.tool_type_display || tool.tool_type}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    <Chip
                                                                        label={projectTool.custom_position || tool.ui_position}
                                                                        size="small"
                                                                        color="secondary"
                                                                        variant="filled"
                                                                    />
                                                                    {tool.is_system && (
                                                                        <Chip
                                                                            label="System"
                                                                            size="small"
                                                                            color="default"
                                                                        />
                                                                    )}
                                                                </Box>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {tool.description}
                                                                </Typography>
                                                            </Box>

                                                            {/* Controls */}
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Switch
                                                                            checked={projectTool.is_enabled}
                                                                            onChange={(e) => handleToggleEnabled(projectTool.id, e.target.checked)}
                                                                            size="small"
                                                                        />
                                                                    }
                                                                    label="Enabled"
                                                                />
                                                                
                                                                <Tooltip title="Configure tool">
                                                                    <IconButton
                                                                        onClick={() => handleConfigureTool(projectTool)}
                                                                        size="small"
                                                                    >
                                                                        <SettingsIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                
                                                                <Tooltip title="Remove tool">
                                                                    <IconButton
                                                                        onClick={() => handleRemoveTool(projectTool.id)}
                                                                        size="small"
                                                                        color="error"
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* Add Tool Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Tool to Project</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Select a tool to add to this project. Users will be able to use these tools in the map interface.
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {getAvailableTools().map((tool) => (
                            <Grid item xs={12} sm={6} md={4} key={tool.id}>
                                <Card
                                    sx={{ cursor: 'pointer', height: '100%' }}
                                    onClick={() => handleAddTool(tool.id)}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                                            <Box
                                                component="span"
                                                sx={{
                                                    fontFamily: 'Material Icons',
                                                    fontSize: 24,
                                                    color: 'primary.main',
                                                }}
                                            >
                                                {tool.icon}
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight="medium">
                                                {tool.name}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                            {tool.description}
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Chip label={tool.tool_type_display || tool.tool_type} size="small" />
                                            {tool.is_system && (
                                                <Chip label="System" size="small" color="default" />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {getAvailableTools().length === 0 && (
                        <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                            All available tools have been added to this project.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Configure Tool Dialog */}
            <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Configure Tool: {selectedTool?.tool_name}</DialogTitle>
                <DialogContent>
                    {selectedTool && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Position</InputLabel>
                                    <Select
                                        value={selectedTool.custom_position || ''}
                                        onChange={(e) => setSelectedTool({
                                            ...selectedTool,
                                            custom_position: e.target.value as string
                                        })}
                                    >
                                        {UI_POSITIONS.map((position) => (
                                            <MenuItem key={position.value} value={position.value}>
                                                {position.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Tool Options (JSON)
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    value={JSON.stringify(selectedTool.tool_options, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const options = JSON.parse(e.target.value);
                                            setSelectedTool({
                                                ...selectedTool,
                                                tool_options: options
                                            });
                                        } catch {
                                            // Invalid JSON, ignore
                                        }
                                    }}
                                    InputProps={{ sx: { fontFamily: 'monospace' } }}
                                    helperText="Configure tool-specific options in JSON format"
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveToolConfig} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectToolsManager;