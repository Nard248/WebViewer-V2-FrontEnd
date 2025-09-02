// src/pages/admin/map-tools/MapToolsPage.tsx
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
    Tooltip,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Code as CodeIcon,
    Build as ToolIcon,
    PlayArrow as PlayIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getMapTools, deleteMapTool } from '../../../services/mapService';
import { MapTool } from '../../../types/map.types';

const MapToolsPage: React.FC = () => {
    const navigate = useNavigate();
    
    const [tools, setTools] = useState<MapTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<MapTool | null>(null);

    useEffect(() => {
        loadTools();
    }, [page, rowsPerPage, search]);

    const loadTools = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getMapTools({
                page: page + 1,
                page_size: rowsPerPage,
                search: search || undefined,
                ordering: '-created_at'
            });
            setTools(response.results);
            setTotalCount(response.count);
        } catch (err) {
            setError('Failed to load map tools. Please try again.');
            console.error('Error loading map tools:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(0);
    };

    const handleDeleteClick = (tool: MapTool) => {
        if (tool.is_system) {
            setError('System tools cannot be deleted.');
            return;
        }
        setToolToDelete(tool);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!toolToDelete) return;
        
        try {
            await deleteMapTool(toolToDelete.id);
            setTools(prev => prev.filter(t => t.id !== toolToDelete.id));
            setTotalCount(prev => prev - 1);
        } catch (err) {
            setError('Failed to delete map tool. Please try again.');
            console.error('Error deleting map tool:', err);
        } finally {
            setDeleteDialogOpen(false);
            setToolToDelete(null);
        }
    };

    const handleEditClick = (id: number) => {
        navigate(`/admin/map-tools/${id}/edit`);
    };

    const handleCodeClick = (id: number) => {
        navigate(`/admin/map-tools/${id}/code`);
    };

    const handleCreateClick = () => {
        navigate('/admin/map-tools/create');
    };

    const getToolTypeColor = (toolType: string) => {
        switch (toolType.toLowerCase()) {
            case 'measure_distance': return 'primary';
            case 'measure_area': return 'secondary';
            case 'draw_point': return 'success';
            case 'draw_line': return 'warning';
            case 'draw_polygon': return 'info';
            case 'export_data': return 'default';
            default: return 'default';
        }
    };

    const getPositionColor = (position: string) => {
        switch (position.toLowerCase()) {
            case 'topright': return 'primary';
            case 'topleft': return 'secondary';
            case 'bottomright': return 'success';
            case 'bottomleft': return 'warning';
            default: return 'default';
        }
    };

    if (loading && tools.length === 0) {
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
                        Map Tools
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage interactive tools for map interfaces
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                >
                    Create Tool
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <ToolIcon color="primary" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{totalCount}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Tools
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
                                <SettingsIcon color="default" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {tools.filter(t => t.is_system).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        System Tools
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
                                <CodeIcon color="info" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {tools.filter(t => !t.is_system).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Custom Tools
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
                                <PlayIcon color="success" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {new Set(tools.map(t => t.tool_type)).size}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Tool Types
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Search */}
            <Box mb={3}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search map tools..."
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
                            <TableCell>Tool Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Position</TableCell>
                            <TableCell>Icon</TableCell>
                            <TableCell>System</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tools.map((tool) => (
                            <TableRow key={tool.id} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            {tool.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                                            {tool.description}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tool.tool_type_display || tool.tool_type}
                                        size="small"
                                        color={getToolTypeColor(tool.tool_type) as any}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tool.ui_position_display || tool.ui_position}
                                        size="small"
                                        color={getPositionColor(tool.ui_position) as any}
                                        variant="filled"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box
                                        component="span"
                                        sx={{
                                            fontFamily: 'Material Icons',
                                            fontSize: 20,
                                            color: 'primary.main',
                                        }}
                                    >
                                        {tool.icon}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tool.is_system ? 'System' : 'Custom'}
                                        size="small"
                                        color={tool.is_system ? 'default' : 'primary'}
                                        variant={tool.is_system ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {new Date(tool.created_at).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        by {tool.created_by_username}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="View/Edit Code">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleCodeClick(tool.id)}
                                            color="info"
                                        >
                                            <CodeIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit Tool">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(tool.id)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {!tool.is_system && (
                                        <Tooltip title="Delete Tool">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(tool)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
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
                <DialogTitle>Delete Map Tool</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the map tool "{toolToDelete?.name}"?
                        This action cannot be undone and may affect projects using this tool.
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

export default MapToolsPage;