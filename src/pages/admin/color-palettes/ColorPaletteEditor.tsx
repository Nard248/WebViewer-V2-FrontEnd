// src/pages/admin/color-palettes/ColorPaletteEditor.tsx
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
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Shuffle as ShuffleIcon,
    ContentCopy as CopyIcon,
    Palette as PaletteIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ColorPalette, 
    ColorPaletteCreate 
} from '../../../types/style.types';
import {
    getColorPalette,
    createColorPalette,
    updateColorPalette,
} from '../../../services/styleService';

const PALETTE_TYPES = [
    'sequential',
    'diverging',
    'qualitative',
    'custom',
];

const PRESET_PALETTES = {
    sequential: [
        ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
        ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
        ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    ],
    diverging: [
        ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e'],
        ['#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837'],
        ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    ],
    qualitative: [
        ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
        ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9'],
    ],
};

const ColorPaletteEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    
    const [palette, setPalette] = useState<ColorPalette | null>(null);
    const [formData, setFormData] = useState<ColorPaletteCreate>({
        name: '',
        description: '',
        colors: ['#1f77b4'],
        palette_type: 'custom',
        is_system: false,
    });
    
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Dialog states
    const [presetDialogOpen, setPresetDialogOpen] = useState(false);
    const [newColor, setNewColor] = useState('#ffffff');

    useEffect(() => {
        if (id) {
            loadPalette(parseInt(id));
        }
    }, [id]);

    const loadPalette = async (paletteId: number) => {
        setLoading(true);
        setError(null);

        try {
            const data = await getColorPalette(paletteId);
            setPalette(data);
            setFormData({
                name: data.name,
                description: data.description,
                colors: [...data.colors],
                palette_type: data.palette_type,
                is_system: data.is_system,
            });
        } catch (err: any) {
            setError('Failed to load color palette. Please try again.');
            console.error('Error loading color palette:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof ColorPaletteCreate) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddColor = () => {
        setFormData(prev => ({
            ...prev,
            colors: [...prev.colors, newColor],
        }));
        setNewColor('#ffffff');
    };

    const handleUpdateColor = (index: number, color: string) => {
        const updatedColors = [...formData.colors];
        updatedColors[index] = color;
        setFormData(prev => ({
            ...prev,
            colors: updatedColors,
        }));
    };

    const handleRemoveColor = (index: number) => {
        if (formData.colors.length > 1) {
            const updatedColors = formData.colors.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                colors: updatedColors,
            }));
        }
    };

    const handleShuffleColors = () => {
        const shuffledColors = [...formData.colors].sort(() => Math.random() - 0.5);
        setFormData(prev => ({
            ...prev,
            colors: shuffledColors,
        }));
    };

    const handleApplyPreset = (colors: string[]) => {
        setFormData(prev => ({
            ...prev,
            colors: [...colors],
        }));
        setPresetDialogOpen(false);
        setSuccess('Preset palette applied successfully.');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (isEditing && id) {
                await updateColorPalette(parseInt(id), formData);
                setSuccess('Color palette updated successfully.');
            } else {
                await createColorPalette(formData);
                setSuccess('Color palette created successfully.');
            }
            
            setTimeout(() => navigate('/admin/color-palettes'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} color palette. Please try again.`);
            console.error(`Error ${isEditing ? 'updating' : 'creating'} color palette:`, err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/color-palettes');
    };

    const handleCopyColors = () => {
        const colorString = formData.colors.join(', ');
        navigator.clipboard.writeText(colorString);
        setSuccess('Colors copied to clipboard!');
    };

    const renderColorPreview = (colors: string[], size: 'small' | 'large' = 'large') => {
        const height = size === 'small' ? 20 : 60;
        return (
            <Box 
                display="flex" 
                height={height} 
                borderRadius={1} 
                overflow="hidden" 
                border="1px solid" 
                borderColor="divider"
                mb={size === 'large' ? 2 : 0}
            >
                {colors.map((color, index) => (
                    <Box
                        key={index}
                        sx={{
                            flex: 1,
                            backgroundColor: color,
                            minWidth: size === 'small' ? 10 : 30,
                            cursor: size === 'large' ? 'pointer' : 'default',
                            '&:hover': size === 'large' ? {
                                opacity: 0.8,
                            } : {},
                        }}
                        title={color}
                        onClick={size === 'large' ? () => {
                            // Could open color picker here
                        } : undefined}
                    />
                ))}
            </Box>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                >
                    Back to Color Palettes
                </Button>
                <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
                    {isEditing ? `Edit: ${palette?.name}` : 'Create Color Palette'}
                </Typography>
                {palette?.is_system && (
                    <Chip
                        label="System Palette"
                        color="default"
                        variant="filled"
                    />
                )}
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

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Left Column - Form Fields */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Palette Information
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Palette Name"
                                        value={formData.name}
                                        onChange={handleInputChange('name')}
                                        fullWidth
                                        required
                                        disabled={palette?.is_system}
                                        helperText={palette?.is_system ? "System palette names cannot be changed" : "Enter a descriptive name"}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Palette Type</InputLabel>
                                        <Select
                                            value={formData.palette_type}
                                            onChange={handleInputChange('palette_type')}
                                        >
                                            {PALETTE_TYPES.map((type) => (
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
                                        value={formData.description}
                                        onChange={handleInputChange('description')}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        helperText="Describe the intended use case for this palette"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Right Column - Color Preview */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Color Preview ({formData.colors.length} colors)
                                </Typography>
                                <Box>
                                    <Tooltip title="Copy colors">
                                        <IconButton onClick={handleCopyColors}>
                                            <CopyIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Shuffle colors">
                                        <IconButton onClick={handleShuffleColors}>
                                            <ShuffleIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            
                            {renderColorPreview(formData.colors)}
                            
                            <Box mb={2}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setPresetDialogOpen(true)}
                                    startIcon={<PaletteIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    Use Preset
                                </Button>
                            </Box>

                            {/* Color List */}
                            <Typography variant="subtitle2" gutterBottom>
                                Colors
                            </Typography>
                            <Box maxHeight={300} overflow="auto">
                                {formData.colors.map((color, index) => (
                                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => handleUpdateColor(index, e.target.value)}
                                            style={{ width: 40, height: 40, border: 'none', borderRadius: 4 }}
                                        />
                                        <TextField
                                            size="small"
                                            value={color}
                                            onChange={(e) => handleUpdateColor(index, e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveColor(index)}
                                            disabled={formData.colors.length === 1}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Add Color */}
                            <Box display="flex" alignItems="center" gap={1} mt={2}>
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    style={{ width: 40, height: 40, border: 'none', borderRadius: 4 }}
                                />
                                <TextField
                                    size="small"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddColor}
                                    variant="outlined"
                                >
                                    Add
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12}>
                        <Box display="flex" gap={2} justifyContent="flex-end">
                            <Button
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                disabled={saving || !formData.name || formData.colors.length === 0}
                            >
                                {isEditing ? 'Update Palette' : 'Create Palette'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>

            {/* Preset Palettes Dialog */}
            <Dialog open={presetDialogOpen} onClose={() => setPresetDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Choose Preset Palette</DialogTitle>
                <DialogContent>
                    {Object.entries(PRESET_PALETTES).map(([type, palettes]) => (
                        <Box key={type} mb={3}>
                            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                {type} Palettes
                            </Typography>
                            <Grid container spacing={2}>
                                {palettes.map((colors, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card 
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleApplyPreset(colors)}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                {renderColorPreview(colors, 'small')}
                                                <Typography variant="caption" color="textSecondary">
                                                    {colors.length} colors
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPresetDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ColorPaletteEditor;