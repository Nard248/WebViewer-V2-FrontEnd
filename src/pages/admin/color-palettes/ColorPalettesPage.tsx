// src/pages/admin/color-palettes/ColorPalettesPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Fab,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Palette as PaletteIcon,
    ContentCopy as CopyIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
    getColorPalettes, 
    deleteColorPalette 
} from '../../../services/styleService';
import { ColorPalette } from '../../../types/style.types';
import { PaginatedResponse } from '../../../types/common.types';

const ColorPalettesPage: React.FC = () => {
    const navigate = useNavigate();
    
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [paletteToDelete, setPaletteToDelete] = useState<ColorPalette | null>(null);

    useEffect(() => {
        loadPalettes();
    }, [search]);

    const loadPalettes = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response: PaginatedResponse<ColorPalette> = await getColorPalettes({ 
                search: search || undefined,
                ordering: '-created_at' 
            });
            setPalettes(response.results);
            setTotalCount(response.count);
        } catch (err) {
            setError('Failed to load color palettes. Please try again.');
            console.error('Error loading color palettes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const handleDeleteClick = (palette: ColorPalette) => {
        if (palette.is_system) {
            setError('System color palettes cannot be deleted.');
            return;
        }
        setPaletteToDelete(palette);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!paletteToDelete) return;
        
        try {
            await deleteColorPalette(paletteToDelete.id);
            setPalettes(prev => prev.filter(p => p.id !== paletteToDelete.id));
            setTotalCount(prev => prev - 1);
            setSuccess('Color palette deleted successfully.');
        } catch (err) {
            setError('Failed to delete color palette. Please try again.');
            console.error('Error deleting color palette:', err);
        } finally {
            setDeleteDialogOpen(false);
            setPaletteToDelete(null);
        }
    };

    const handleEditClick = (id: number) => {
        navigate(`/admin/color-palettes/${id}/edit`);
    };

    const handleCreateClick = () => {
        navigate('/admin/color-palettes/create');
    };

    const handleCopyColors = (colors: string[]) => {
        const colorString = colors.join(', ');
        navigator.clipboard.writeText(colorString);
        setSuccess('Colors copied to clipboard!');
        setTimeout(() => setSuccess(null), 3000);
    };

    const renderColorPreview = (colors: string[]) => {
        return (
            <Box display="flex" height={40} borderRadius={1} overflow="hidden" mb={2}>
                {colors.map((color, index) => (
                    <Box
                        key={index}
                        sx={{
                            flex: 1,
                            backgroundColor: color,
                            minWidth: 20,
                        }}
                        title={color}
                    />
                ))}
            </Box>
        );
    };

    const getPaletteTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'sequential': return 'info';
            case 'diverging': return 'warning';
            case 'qualitative': return 'success';
            case 'custom': return 'primary';
            default: return 'default';
        }
    };

    if (loading && palettes.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" component="h1">
                        Color Palettes
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {totalCount} palette{totalCount !== 1 ? 's' : ''} available
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                >
                    Create Palette
                </Button>
            </Box>

            {/* Search */}
            <Box mb={3}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search color palettes..."
                    value={search}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
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

            {/* Palettes Grid */}
            {palettes.length === 0 && !loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <PaletteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No Color Palettes Found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                        {search ? 'Try adjusting your search terms.' : 'Create your first color palette to get started.'}
                    </Typography>
                    {!search && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateClick}
                        >
                            Create Your First Palette
                        </Button>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {palettes.map((palette) => (
                        <Grid item xs={12} sm={6} md={4} key={palette.id}>
                            <Card>
                                <CardContent>
                                    {/* Color Preview */}
                                    {renderColorPreview(palette.colors)}
                                    
                                    {/* Palette Info */}
                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                        <Typography variant="h6" component="h3" sx={{ wordBreak: 'break-word' }}>
                                            {palette.name}
                                        </Typography>
                                        <Chip
                                            label={palette.palette_type}
                                            size="small"
                                            color={getPaletteTypeColor(palette.palette_type) as any}
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        {palette.description}
                                    </Typography>

                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Typography variant="caption" color="textSecondary">
                                            {palette.colors.length} colors
                                        </Typography>
                                        {palette.is_system && (
                                            <Chip label="System" size="small" color="default" />
                                        )}
                                    </Box>

                                    <Typography variant="caption" color="textSecondary">
                                        Created by {palette.created_by_username} • {new Date(palette.created_at).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                                
                                <CardActions>
                                    <Tooltip title="Copy colors">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleCopyColors(palette.colors)}
                                        >
                                            <CopyIcon />
                                        </IconButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Preview">
                                        <IconButton 
                                            size="small"
                                            onClick={() => handleEditClick(palette.id)}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </Tooltip>
                                    
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(palette.id)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    
                                    {!palette.is_system && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(palette)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Floating Action Button for Mobile */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' },
                }}
                onClick={handleCreateClick}
            >
                <AddIcon />
            </Fab>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Color Palette</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the color palette "{paletteToDelete?.name}"?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ColorPalettesPage;