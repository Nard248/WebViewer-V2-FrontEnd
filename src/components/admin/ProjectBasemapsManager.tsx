// src/components/admin/ProjectBasemapsManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Checkbox,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Alert,
    CircularProgress,
    Tooltip,
    Switch,
} from '@mui/material';
import {
    DragIndicator as DragIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Map as MapIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getBasemaps, getProjectBasemaps, updateProjectBasemaps } from '../../services/basemapService';
import { Project } from '../../types/project.types';

interface Basemap {
    id: number;
    name: string;
    description?: string;
    provider: string;
    preview_image?: string;
    attribution?: string;
    is_system: boolean;
}

interface ProjectBasemap {
    id: number;
    project: number;
    basemap: number;
    is_default: boolean;
    display_order: number;
    custom_options?: Record<string, any>;
    // Expanded data
    basemap_data?: Basemap;
}

interface ProjectBasemapsManagerProps {
    project: Project;
    onUpdate?: () => void;
}

const ProjectBasemapsManager: React.FC<ProjectBasemapsManagerProps> = ({ project, onUpdate }) => {
    const [availableBasemaps, setAvailableBasemaps] = useState<Basemap[]>([]);
    const [projectBasemaps, setProjectBasemaps] = useState<ProjectBasemap[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [selectedBasemaps, setSelectedBasemaps] = useState<number[]>([]);

    useEffect(() => {
        loadData();
    }, [project.id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [basemapsResponse, projectBasemapsResponse] = await Promise.all([
                getBasemaps(),
                getProjectBasemaps(project.id),
            ]);

            setAvailableBasemaps(basemapsResponse.results);
            setProjectBasemaps(projectBasemapsResponse);
        } catch (err) {
            setError('Failed to load basemaps. Please try again.');
            console.error('Error loading basemaps:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(projectBasemaps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update display_order
        const updatedItems = items.map((item, index) => ({
            ...item,
            display_order: index + 1,
        }));

        setProjectBasemaps(updatedItems);
        saveBasemapOrder(updatedItems);
    };

    const saveBasemapOrder = async (orderedBasemaps: ProjectBasemap[]) => {
        setSaving(true);
        
        try {
            await updateProjectBasemaps(
                project.id,
                orderedBasemaps.map((pb, index) => ({
                    basemap_id: pb.basemap,
                    is_default: pb.is_default,
                    display_order: index + 1,
                    custom_options: pb.custom_options,
                }))
            );
            
            setSuccess('Basemap order updated successfully.');
            onUpdate?.();
        } catch (err) {
            setError('Failed to update basemap order. Please try again.');
            console.error('Error updating basemap order:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefault = async (basemapId: number) => {
        const updatedBasemaps = projectBasemaps.map(pb => ({
            ...pb,
            is_default: pb.basemap === basemapId,
        }));

        setProjectBasemaps(updatedBasemaps);

        try {
            await updateProjectBasemaps(
                project.id,
                updatedBasemaps.map(pb => ({
                    basemap_id: pb.basemap,
                    is_default: pb.is_default,
                    display_order: pb.display_order,
                    custom_options: pb.custom_options,
                }))
            );
            
            setSuccess('Default basemap updated successfully.');
            onUpdate?.();
        } catch (err) {
            setError('Failed to update default basemap. Please try again.');
            console.error('Error updating default basemap:', err);
        }
    };

    const handleRemoveBasemap = async (basemapId: number) => {
        const updatedBasemaps = projectBasemaps.filter(pb => pb.basemap !== basemapId);
        
        setProjectBasemaps(updatedBasemaps);

        try {
            await updateProjectBasemaps(
                project.id,
                updatedBasemaps.map(pb => ({
                    basemap_id: pb.basemap,
                    is_default: pb.is_default,
                    display_order: pb.display_order,
                    custom_options: pb.custom_options,
                }))
            );
            
            setSuccess('Basemap removed successfully.');
            onUpdate?.();
        } catch (err) {
            setError('Failed to remove basemap. Please try again.');
            console.error('Error removing basemap:', err);
        }
    };

    const handleAddBasemaps = async () => {
        if (selectedBasemaps.length === 0) {
            setAddDialogOpen(false);
            return;
        }

        const newBasemaps = selectedBasemaps.map((basemapId, index) => ({
            basemap_id: basemapId,
            is_default: projectBasemaps.length === 0 && index === 0, // First basemap is default if none exist
            display_order: projectBasemaps.length + index + 1,
            custom_options: {},
        }));

        try {
            await updateProjectBasemaps(project.id, [
                ...projectBasemaps.map(pb => ({
                    basemap_id: pb.basemap,
                    is_default: pb.is_default,
                    display_order: pb.display_order,
                    custom_options: pb.custom_options,
                })),
                ...newBasemaps,
            ]);
            
            setSuccess(`${selectedBasemaps.length} basemap(s) added successfully.`);
            setSelectedBasemaps([]);
            setAddDialogOpen(false);
            loadData();
            onUpdate?.();
        } catch (err) {
            setError('Failed to add basemaps. Please try again.');
            console.error('Error adding basemaps:', err);
        }
    };

    const getAvailableBasemaps = () => {
        const usedBasemapIds = projectBasemaps.map(pb => pb.basemap);
        return availableBasemaps.filter(b => !usedBasemapIds.includes(b.id));
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
                <Typography variant="h6">
                    Project Basemaps ({projectBasemaps.length})
                </Typography>
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => setAddDialogOpen(true)}
                    variant="outlined"
                    disabled={getAvailableBasemaps().length === 0}
                >
                    Add Basemaps
                </Button>
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

            {/* Basemaps List */}
            {projectBasemaps.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <MapIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No Basemaps Added
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                        Add basemaps to provide different map backgrounds for this project.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAddDialogOpen(true)}
                        disabled={getAvailableBasemaps().length === 0}
                    >
                        Add Your First Basemap
                    </Button>
                </Paper>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="project-basemaps">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {projectBasemaps.map((projectBasemap, index) => {
                                    const basemap = availableBasemaps.find(b => b.id === projectBasemap.basemap);
                                    if (!basemap) return null;

                                    return (
                                        <Draggable
                                            key={projectBasemap.basemap}
                                            draggableId={projectBasemap.basemap.toString()}
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

                                                            {/* Basemap Info */}
                                                            <Box flex={1}>
                                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                                        {basemap.name}
                                                                    </Typography>
                                                                    {projectBasemap.is_default && (
                                                                        <Chip
                                                                            icon={<StarIcon />}
                                                                            label="Default"
                                                                            size="small"
                                                                            color="primary"
                                                                        />
                                                                    )}
                                                                    <Chip
                                                                        label={basemap.provider}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    {basemap.is_system && (
                                                                        <Chip
                                                                            label="System"
                                                                            size="small"
                                                                            color="default"
                                                                        />
                                                                    )}
                                                                </Box>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {basemap.description}
                                                                </Typography>
                                                            </Box>

                                                            {/* Actions */}
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Tooltip title={projectBasemap.is_default ? "Remove as default" : "Set as default"}>
                                                                    <IconButton
                                                                        onClick={() => handleSetDefault(projectBasemap.basemap)}
                                                                        disabled={saving}
                                                                    >
                                                                        {projectBasemap.is_default ? <StarIcon color="primary" /> : <StarBorderIcon />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Remove basemap">
                                                                    <IconButton
                                                                        onClick={() => handleRemoveBasemap(projectBasemap.basemap)}
                                                                        disabled={saving}
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

            {/* Add Basemaps Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Basemaps to Project</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Select basemaps to add to this project. Users will be able to switch between these basemaps.
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {getAvailableBasemaps().map((basemap) => (
                            <Grid item xs={12} sm={6} md={4} key={basemap.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        border: selectedBasemaps.includes(basemap.id) ? 2 : 1,
                                        borderColor: selectedBasemaps.includes(basemap.id) ? 'primary.main' : 'divider',
                                    }}
                                    onClick={() => {
                                        setSelectedBasemaps(prev =>
                                            prev.includes(basemap.id)
                                                ? prev.filter(id => id !== basemap.id)
                                                : [...prev, basemap.id]
                                        );
                                    }}
                                >
                                    {basemap.preview_image && (
                                        <CardMedia
                                            component="img"
                                            height="100"
                                            image={basemap.preview_image}
                                            alt={basemap.name}
                                        />
                                    )}
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="medium">
                                                    {basemap.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {basemap.provider}
                                                </Typography>
                                            </Box>
                                            <Checkbox
                                                checked={selectedBasemaps.includes(basemap.id)}
                                                onChange={() => {}} // Handled by card click
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {getAvailableBasemaps().length === 0 && (
                        <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                            All available basemaps have been added to this project.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddBasemaps}
                        variant="contained"
                        disabled={selectedBasemaps.length === 0}
                    >
                        Add {selectedBasemaps.length} Basemap{selectedBasemaps.length !== 1 ? 's' : ''}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectBasemapsManager;