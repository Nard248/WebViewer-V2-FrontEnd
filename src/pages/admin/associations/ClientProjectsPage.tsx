// src/pages/admin/associations/ClientProjectsPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    Chip,
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
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Tooltip,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Link as LinkIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Visibility as ViewIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { getClients } from '../../../services/clientService';
import { getProjects } from '../../../services/projectService';
import { Client } from '../../../types';
import { Project } from '../../../types/project.types';

interface ClientProject {
    id: number;
    client: number;
    project: number;
    unique_link: string;
    is_active: boolean;
    expires_at?: string;
    last_accessed?: string;
    created_at: string;
    // Expanded data
    client_name?: string;
    project_name?: string;
}

interface ClientProjectCreate {
    client: number;
    project: number;
    is_active: boolean;
    expires_at?: string;
}

const ClientProjectsPage: React.FC = () => {
    const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAssociation, setSelectedAssociation] = useState<ClientProject | null>(null);
    
    // Form state
    const [formData, setFormData] = useState<ClientProjectCreate>({
        client: 0,
        project: 0,
        is_active: true,
        expires_at: undefined,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [clientsResponse, projectsResponse] = await Promise.all([
                getClients(),
                getProjects(),
            ]);

            setClients(clientsResponse.results);
            setProjects(projectsResponse.results);

            // Mock data for client-project associations
            // In real implementation, this would come from API
            const mockClientProjects: ClientProject[] = [
                {
                    id: 1,
                    client: clientsResponse.results[0]?.id || 1,
                    project: projectsResponse.results[0]?.id || 1,
                    unique_link: 'https://example.com/viewer/abc123',
                    is_active: true,
                    expires_at: '2024-12-31T23:59:59Z',
                    last_accessed: '2024-01-15T10:30:00Z',
                    created_at: '2024-01-01T00:00:00Z',
                    client_name: clientsResponse.results[0]?.name,
                    project_name: projectsResponse.results[0]?.name,
                },
            ];
            setClientProjects(mockClientProjects);
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setFormData({
            client: 0,
            project: 0,
            is_active: true,
            expires_at: undefined,
        });
        setCreateDialogOpen(true);
    };

    const handleEditClick = (association: ClientProject) => {
        setSelectedAssociation(association);
        setFormData({
            client: association.client,
            project: association.project,
            is_active: association.is_active,
            expires_at: association.expires_at,
        });
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (association: ClientProject) => {
        setSelectedAssociation(association);
        setDeleteDialogOpen(true);
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(null), 3000);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    const getStatusChip = (association: ClientProject) => {
        if (!association.is_active) {
            return <Chip label="Inactive" size="small" color="default" />;
        }
        
        if (association.expires_at && new Date(association.expires_at) < new Date()) {
            return <Chip label="Expired" size="small" color="error" />;
        }
        
        return <Chip label="Active" size="small" color="success" />;
    };

    const displayedAssociations = clientProjects.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Client-Project Associations
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                >
                    Create Association
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <LinkIcon color="primary" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{clientProjects.length}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Associations
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
                                <ViewIcon color="success" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {clientProjects.filter(cp => cp.is_active).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Active
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
                                <CalendarIcon color="warning" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {clientProjects.filter(cp => cp.expires_at && new Date(cp.expires_at) < new Date()).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Expired
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
                                <TimeIcon color="info" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">
                                        {clientProjects.filter(cp => cp.last_accessed).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Recently Accessed
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
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

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Client</TableCell>
                            <TableCell>Project</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Access Link</TableCell>
                            <TableCell>Expires At</TableCell>
                            <TableCell>Last Accessed</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedAssociations.map((association) => (
                            <TableRow key={association.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight="medium">
                                        {association.client_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {association.project_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {getStatusChip(association)}
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2" color="primary" noWrap sx={{ maxWidth: 200 }}>
                                            {association.unique_link}
                                        </Typography>
                                        <Tooltip title="Copy link">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyLink(association.unique_link)}
                                            >
                                                <CopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(association.expires_at)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(association.last_accessed)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(association)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick(association)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <TablePagination
                    component="div"
                    count={clientProjects.length}
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

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Client-Project Association</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Client</InputLabel>
                                <Select
                                    value={formData.client}
                                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value as number }))}
                                >
                                    {clients.map((client) => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Project</InputLabel>
                                <Select
                                    value={formData.project}
                                    onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value as number }))}
                                >
                                    {projects.map((project) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" disabled={!formData.client || !formData.project}>
                        Create Association
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Association</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the association between "{selectedAssociation?.client_name}" 
                        and "{selectedAssociation?.project_name}"? This will revoke their access to the project.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClientProjectsPage;