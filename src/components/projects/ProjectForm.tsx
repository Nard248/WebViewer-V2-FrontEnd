// src/components/projects/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    Grid,
    Tabs,
    Tab,
    Divider,
    Alert,
    CircularProgress,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Card,
    CardContent,
} from '@mui/material';
import {
    Save as SaveIcon,
    Preview as PreviewIcon,
    Close as CancelIcon,
    Map as MapIcon,
    Layers as LayersIcon,
    Tune as ToolsIcon,
    People as ClientsIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, ProjectCreate, ProjectUpdate } from '../../types/project.types';
import {
    getProjectDetails,
    createProject,
    updateProject,
} from '../../services/projectService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div
            role="tabpanel"
    hidden={value !== index}
    id={`project-tabpanel-${index}`}
    aria-labelledby={`project-tab-${index}`}
>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
    );
    };

    const ProjectForm: React.FC = () => {
        const { id } = useParams<{ id: string }>();
        const navigate = useNavigate();
        const [tabValue, setTabValue] = useState(0);
        const [loading, setLoading] = useState(id ? true : false);
        const [saving, setSaving] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [success, setSuccess] = useState<string | null>(null);

        // Project basic info
        const [formData, setFormData] = useState<ProjectCreate | ProjectUpdate>({
            name: '',
            description: '',
            is_public: false,
            is_active: true,
            default_center_lat: 0,
            default_center_lng: 0,
            default_zoom_level: 5,
            max_zoom: 18,
            min_zoom: 1,
            map_controls: {
                showZoomControl: true,
                showScaleControl: true,
                showLayerControl: true,
                showMeasureTools: true,
                showDrawingTools: true,
                showExportTools: true,
                showSearchControl: true,
                showAttributionControl: true,
                showCoordinateControl: true,
            },
            map_options: {
                enableClustering: true,
                clusterRadius: 80,
                enableGeolocate: true,
                enableFullscreen: true,
                enablePopups: true,
                popupOffset: 10,
                maxBounds: null,
            },
        });

        useEffect(() => {
            if (id) {
                loadProject(parseInt(id));
            }
        }, [id]);

        const loadProject = async (projectId: number) => {
            setLoading(true);
            setError(null);

            try {
                const project = await getProjectDetails(projectId);
                setFormData(project);
            } catch (err) {
                setError('Failed to load project details. Please try again.');
                console.error('Error loading project:', err);
            } finally {
                setLoading(false);
            }
        };

        const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
            setTabValue(newValue);
        };

        const handleInputChange = (
            e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
        ) => {
            const { name, value } = e.target;
            if (name) {
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        };

        const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({
                ...prev,
                [name]: e.target.checked,
            }));
        };

        const handleMapControlChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({
                ...prev,
                map_controls: {
                    ...prev.map_controls,
                    [name]: e.target.checked,
                },
            }));
        };

        const handleMapOptionChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const { checked, value } = e.target;

            setFormData((prev) => ({
                ...prev,
                map_options: {
                    ...prev.map_options,
                    [name]: e.target.type === 'checkbox' ? checked : value,
                },
            }));
        };

        const handleZoomChange = (event: Event, newValue: number | number[]) => {
            setFormData((prev) => ({
                ...prev,
                default_zoom_level: newValue as number,
            }));
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            setSuccess(null);

            try {
                if (id) {
                    // Update existing project
                    await updateProject(parseInt(id), formData);
                    setSuccess('Project updated successfully!');
                } else {
                    // Create new project
                    const createdProject = await createProject(formData);
                    setSuccess('Project created successfully!');

                    // Redirect to edit page after a short delay
                    setTimeout(() => {
                        navigate(`/projects/${createdProject.id}/edit`);
                    }, 1500);
                }
            } catch (err) {
                setError('Failed to save project. Please check your input and try again.');
                console.error('Error saving project:', err);
            } finally {
                setSaving(false);
            }
        };

        const handleCancel = () => {
            navigate('/projects');
        };

        const handlePreview = () => {
            if (id) {
                navigate(`/projects/${id}/view`);
            } else {
                // Can't preview a project that hasn't been created yet
                setError('You need to save the project before previewing it.');
            }
        };

        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
            </Box>
        );
        }

        return (
            <Box component="form" onSubmit={handleSubmit}>
        <Box
            sx={{
            display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
        }}
    >
        <Typography variant="h4" component="h1">
            {id ? 'Edit Project' : 'Create Project'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
            variant="outlined"
        startIcon={<CancelIcon />}
        onClick={handleCancel}
            >
            Cancel
            </Button>
            <Button
        variant="outlined"
        color="secondary"
        startIcon={<PreviewIcon />}
        onClick={handlePreview}
        disabled={!id || saving}
    >
        Preview
        </Button>
        <Button
        type="submit"
        variant="contained"
        color="primary"
        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        disabled={saving}
            >
            {saving ? 'Saving...' : 'Save Project'}
            </Button>
            </Box>
            </Box>

        {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            </Alert>
        )}

        {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
            {success}
            </Alert>
        )}

        <Paper elevation={1} sx={{ mb: 4 }}>
        <Tabs
            value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="project configuration tabs"
        >
        <Tab icon={<MapIcon />} label="Basic Info" id="project-tab-0" />
        <Tab icon={<LayersIcon />} label="Layers" id="project-tab-1" disabled={!id} />
        <Tab icon={<ToolsIcon />} label="Tools" id="project-tab-2" disabled={!id} />
        <Tab icon={<ClientsIcon />} label="Sharing" id="project-tab-3" disabled={!id} />
        </Tabs>

        <Divider />

        <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
        <TextField
            label="Project Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        fullWidth
        required
        margin="normal"
        />

        <TextField
            label="Project Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        />

        <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
        Status & Visibility
        </Typography>
        <Box sx={{ display: 'flex', gap: 4 }}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.is_active}
        onChange={handleSwitchChange('is_active')}
        color="primary"
            />
    }
        label="Active Project"
        />
        <FormControlLabel
            control={
            <Switch
        checked={formData.is_public}
        onChange={handleSwitchChange('is_public')}
        color="primary"
            />
    }
        label="Public Project"
            />
            </Box>
            </Box>
            </Grid>

            <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
            <Typography variant="subtitle1" gutterBottom>
        Default Map View
        </Typography>

        <TextField
        label="Center Latitude"
        name="default_center_lat"
        type="number"
        value={formData.default_center_lat}
        onChange={handleInputChange}
        fullWidth
        margin="normal"
        InputProps={{
            inputProps: { step: 0.000001, min: -90, max: 90 },
        }}
        />

        <TextField
        label="Center Longitude"
        name="default_center_lng"
        type="number"
        value={formData.default_center_lng}
        onChange={handleInputChange}
        fullWidth
        margin="normal"
        InputProps={{
            inputProps: { step: 0.000001, min: -180, max: 180 },
        }}
        />

        <Typography gutterBottom>
        Default Zoom Level: {formData.default_zoom_level}
        </Typography>
        <Slider
        value={formData.default_zoom_level}
        onChange={handleZoomChange}
        step={1}
        marks
        min={1}
        max={18}
        valueLabelDisplay="auto"
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
        <TextField
            label="Min Zoom"
        name="min_zoom"
        type="number"
        value={formData.min_zoom}
        onChange={handleInputChange}
        fullWidth
        margin="normal"
        InputProps={{
            inputProps: { min: 1, max: 18 },
        }}
        />
        </Grid>
        <Grid item xs={6}>
        <TextField
            label="Max Zoom"
        name="max_zoom"
        type="number"
        value={formData.max_zoom}
        onChange={handleInputChange}
        fullWidth
        margin="normal"
        InputProps={{
            inputProps: { min: 1, max: 22 },
        }}
        />
        </Grid>
        </Grid>
        </CardContent>
        </Card>
        </Grid>

        <Grid item xs={12} md={6}>
        <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle1" gutterBottom>
        Map Controls
        </Typography>
        <Grid container spacing={2}>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showZoomControl}
        onChange={handleMapControlChange('showZoomControl')}
        color="primary"
            />
    }
        label="Zoom Control"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showScaleControl}
        onChange={handleMapControlChange('showScaleControl')}
        color="primary"
            />
    }
        label="Scale Control"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showLayerControl}
        onChange={handleMapControlChange('showLayerControl')}
        color="primary"
            />
    }
        label="Layer Control"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showMeasureTools}
        onChange={handleMapControlChange('showMeasureTools')}
        color="primary"
            />
    }
        label="Measure Tools"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showDrawingTools}
        onChange={handleMapControlChange('showDrawingTools')}
        color="primary"
            />
    }
        label="Drawing Tools"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showExportTools}
        onChange={handleMapControlChange('showExportTools')}
        color="primary"
            />
    }
        label="Export Tools"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showSearchControl}
        onChange={handleMapControlChange('showSearchControl')}
        color="primary"
            />
    }
        label="Search Control"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_controls.showAttributionControl}
        onChange={handleMapControlChange('showAttributionControl')}
        color="primary"
            />
    }
        label="Attribution"
            />
            </Grid>
            </Grid>
            </CardContent>
            </Card>
            </Grid>

            <Grid item xs={12} md={6}>
        <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle1" gutterBottom>
        Map Options
        </Typography>
        <Grid container spacing={2}>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_options.enableClustering}
        onChange={handleMapOptionChange('enableClustering')}
        color="primary"
            />
    }
        label="Enable Clustering"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_options.enableGeolocate}
        onChange={handleMapOptionChange('enableGeolocate')}
        color="primary"
            />
    }
        label="Enable Geolocation"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_options.enableFullscreen}
        onChange={handleMapOptionChange('enableFullscreen')}
        color="primary"
            />
    }
        label="Enable Fullscreen"
            />
            </Grid>
            <Grid item xs={6}>
        <FormControlLabel
            control={
            <Switch
        checked={formData.map_options.enablePopups}
        onChange={handleMapOptionChange('enablePopups')}
        color="primary"
            />
    }
        label="Enable Popups"
            />
            </Grid>

        {formData.map_options.enableClustering && (
            <Grid item xs={12}>
        <TextField
            label="Cluster Radius"
            name="clusterRadius"
            type="number"
            value={formData.map_options.clusterRadius}
            onChange={(e) =>
            setFormData(prev => ({
                ...prev,
                map_options: {
                    ...prev.map_options,
                    clusterRadius: parseInt(e.target.value)
                }
            }))
        }
            fullWidth
            margin="normal"
            InputProps={{
            inputProps: { min: 20, max: 200 },
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
        }}
            />
            </Grid>
        )}

        {formData.map_options.enablePopups && (
            <Grid item xs={12}>
        <TextField
            label="Popup Offset"
            name="popupOffset"
            type="number"
            value={formData.map_options.popupOffset}
            onChange={(e) =>
            setFormData(prev => ({
                ...prev,
                map_options: {
                    ...prev.map_options,
                    popupOffset: parseInt(e.target.value)
                }
            }))
        }
            fullWidth
            margin="normal"
            InputProps={{
            inputProps: { min: 0, max: 50 },
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
        }}
            />
            </Grid>
        )}
        </Grid>
        </CardContent>
        </Card>
        </Grid>
        </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
        <Alert severity="info">
            Configure layers after creating the base project. You'll be redirected to this tab automatically after saving.
        </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
        <Alert severity="info">
            Configure map tools after creating the base project. You'll be redirected to this tab automatically after saving.
        </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
        <Alert severity="info">
            Configure project sharing and access control after creating the base project. You'll be redirected to this tab automatically after saving.
        </Alert>
        </TabPanel>
        </Paper>
        </Box>
    );
    };
    export default ProjectForm;