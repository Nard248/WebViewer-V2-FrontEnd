// src/pages/admin/layer-types/LayerTypeEditPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Divider,
    Chip,
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    Preview as PreviewIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    LayerType, 
    LayerTypeUpdate, 
    getLayerType, 
    updateLayerType 
} from '../../../services/layerTypeService';

const LayerTypeEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [layerType, setLayerType] = useState<LayerType | null>(null);
    const [formData, setFormData] = useState<LayerTypeUpdate>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const iconTypes = [
        'marker',
        'circle',
        'square',
        'triangle',
        'star',
        'polygon',
        'line',
        'point',
        'custom',
    ];

    useEffect(() => {
        if (id) {
            loadLayerType(parseInt(id));
        }
    }, [id]);

    const loadLayerType = async (layerTypeId: number) => {
        setLoading(true);
        setError(null);

        try {
            const data = await getLayerType(layerTypeId);
            setLayerType(data);
            setFormData({
                type_name: data.type_name,
                description: data.description || '',
                icon_type: data.icon_type || '',
                default_style: data.default_style || {
                    color: '#3388ff',
                    weight: 3,
                    opacity: 1,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2,
                },
                icon_options: data.icon_options || {},
            });
        } catch (err: any) {
            setError('Failed to load layer type. Please try again.');
            console.error('Error loading layer type:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof LayerTypeUpdate) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const value = event.target.value as string;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStyleChange = (property: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            default_style: {
                ...prev.default_style,
                [property]: value,
            },
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id) return;

        setSaving(true);
        setError(null);

        try {
            await updateLayerType(parseInt(id), formData);
            navigate('/admin/layer-types');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update layer type. Please try again.');
            console.error('Error updating layer type:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/layer-types');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!layerType) {
        return (
            <Box>
                <Alert severity="error">Layer type not found.</Alert>
            </Box>
        );
    }

    const isSystemType = layerType.is_system;

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                >
                    Back to Layer Types
                </Button>
                <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
                    Edit Layer Type: {layerType.type_name}
                </Typography>
                {isSystemType && (
                    <Chip
                        icon={<LockIcon />}
                        label="System Type"
                        color="default"
                        variant="filled"
                    />
                )}
            </Box>

            {/* System Type Warning */}
            {isSystemType && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This is a system layer type. Some modifications may be restricted.
                </Alert>
            )}

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Basic Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Type Name"
                                value={formData.type_name || ''}
                                onChange={handleInputChange('type_name')}
                                fullWidth
                                required
                                disabled={isSystemType}
                                helperText={isSystemType ? "System type names cannot be changed" : "Unique identifier for this layer type"}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Icon Type</InputLabel>
                                <Select
                                    value={formData.icon_type || ''}
                                    onChange={handleInputChange('icon_type')}
                                >
                                    {iconTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                value={formData.description || ''}
                                onChange={handleInputChange('description')}
                                fullWidth
                                multiline
                                rows={3}
                                helperText="Optional description for this layer type"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        {/* Default Style Configuration */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Default Style Configuration
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Stroke Style
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Stroke Color"
                                                type="color"
                                                value={formData.default_style?.color || '#3388ff'}
                                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Stroke Weight"
                                                type="number"
                                                value={formData.default_style?.weight || 3}
                                                onChange={(e) => handleStyleChange('weight', parseInt(e.target.value))}
                                                fullWidth
                                                inputProps={{ min: 1, max: 10 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Stroke Opacity"
                                                type="number"
                                                value={formData.default_style?.opacity || 1}
                                                onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
                                                fullWidth
                                                inputProps={{ min: 0, max: 1, step: 0.1 }}
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
                                        Fill Style
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Fill Color"
                                                type="color"
                                                value={formData.default_style?.fillColor || '#3388ff'}
                                                onChange={(e) => handleStyleChange('fillColor', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Fill Opacity"
                                                type="number"
                                                value={formData.default_style?.fillOpacity || 0.2}
                                                onChange={(e) => handleStyleChange('fillOpacity', parseFloat(e.target.value))}
                                                fullWidth
                                                inputProps={{ min: 0, max: 1, step: 0.1 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Box display="flex" gap={2} justifyContent="flex-end">
                                <Button
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    startIcon={<PreviewIcon />}
                                    variant="outlined"
                                    disabled={saving}
                                >
                                    Preview Style
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={saving || !formData.type_name}
                                >
                                    Update Layer Type
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default LayerTypeEditPage;