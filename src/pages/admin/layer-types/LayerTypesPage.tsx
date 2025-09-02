// src/pages/admin/layer-types/LayerTypesPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
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
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Code as CodeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LayerType, getLayerTypes, deleteLayerType } from '../../../services/layerTypeService';

const LayerTypesPage: React.FC = () => {
    const navigate = useNavigate();
    
    const [layerTypes, setLayerTypes] = useState<LayerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [layerTypeToDelete, setLayerTypeToDelete] = useState<LayerType | null>(null);

    useEffect(() => {
        loadLayerTypes();
    }, [page, rowsPerPage, search]);

    const loadLayerTypes = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getLayerTypes(page + 1, search || undefined);
            setLayerTypes(response.results);
            setTotalCount(response.count);
        } catch (err) {
            setError('Failed to load layer types. Please try again.');
            console.error('Error loading layer types:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(0);
    };

    const handleDeleteClick = (layerType: LayerType) => {
        if (layerType.is_system) {
            setError('System layer types cannot be deleted.');
            return;
        }
        setLayerTypeToDelete(layerType);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!layerTypeToDelete) return;
        
        try {
            await deleteLayerType(layerTypeToDelete.id);
            setLayerTypes(prev => prev.filter(lt => lt.id !== layerTypeToDelete.id));
            setTotalCount(prev => prev - 1);
        } catch (err) {
            setError('Failed to delete layer type. Please try again.');
            console.error('Error deleting layer type:', err);
        } finally {
            setDeleteDialogOpen(false);
            setLayerTypeToDelete(null);
        }
    };

    const handleEditClick = (id: number) => {
        navigate(`/admin/layer-types/${id}/edit`);
    };

    const handleCreateClick = () => {
        navigate('/admin/layer-types/create');
    };

    if (loading && layerTypes.length === 0) {
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
                <Typography variant="h4" component="h1">
                    Layer Types
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                >
                    Create Layer Type
                </Button>
            </Box>

            {/* Search */}
            <Box mb={3}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search layer types..."
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

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Icon Type</TableCell>
                            <TableCell>System</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {layerTypes.map((layerType) => (
                            <TableRow key={layerType.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight="medium">
                                        {layerType.type_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {layerType.description || '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {layerType.icon_type && (
                                        <Chip
                                            icon={<CodeIcon />}
                                            label={layerType.icon_type}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={layerType.is_system ? 'System' : 'Custom'}
                                        size="small"
                                        color={layerType.is_system ? 'default' : 'primary'}
                                        variant={layerType.is_system ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {new Date(layerType.created_at).toLocaleDateString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(layerType.id)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    {!layerType.is_system && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(layerType)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Layer Type</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the layer type "{layerTypeToDelete?.type_name}"?
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

export default LayerTypesPage;