// src/pages/admin/permissions/LayerPermissionsPage.tsx
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
    Checkbox,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    FileDownload as ExportIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import { getProjects } from '../../../services/projectService';
import { 
    LayerPermissionMatrix,
    getLayerPermissionMatrix,
    updateLayerPermissionMatrix 
} from '../../../services/permissionService';
import { Project } from '../../../types/project.types';

interface PermissionUpdate {
    layer_id: number;
    client_project_id: number;
    can_view: boolean;
    can_edit: boolean;
    can_export: boolean;
}

const LayerPermissionsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | ''>('');
    const [permissionMatrix, setPermissionMatrix] = useState<LayerPermissionMatrix[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [pendingUpdates, setPendingUpdates] = useState<Map<string, PermissionUpdate>>(new Map());

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadPermissionMatrix(selectedProject as number);
        }
    }, [selectedProject]);

    const loadProjects = async () => {
        try {
            const response = await getProjects();
            setProjects(response.results);
        } catch (err) {
            setError('Failed to load projects. Please try again.');
            console.error('Error loading projects:', err);
        }
    };

    const loadPermissionMatrix = async (projectId: number) => {
        setLoading(true);
        setError(null);
        setPendingUpdates(new Map());

        try {
            const matrix = await getLayerPermissionMatrix(projectId);
            setPermissionMatrix(matrix);
        } catch (err) {
            setError('Failed to load permission matrix. Please try again.');
            console.error('Error loading permission matrix:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (
        layerId: number,
        clientProjectId: number,
        permission: 'can_view' | 'can_edit' | 'can_export',
        value: boolean
    ) => {
        const key = `${layerId}-${clientProjectId}`;
        const existing = pendingUpdates.get(key);
        
        const update: PermissionUpdate = {
            layer_id: layerId,
            client_project_id: clientProjectId,
            can_view: existing?.can_view ?? getCurrentPermission(layerId, clientProjectId, 'can_view'),
            can_edit: existing?.can_edit ?? getCurrentPermission(layerId, clientProjectId, 'can_edit'),
            can_export: existing?.can_export ?? getCurrentPermission(layerId, clientProjectId, 'can_export'),
            [permission]: value,
        };

        setPendingUpdates(new Map(pendingUpdates.set(key, update)));
        
        // Update matrix display
        setPermissionMatrix(prev => 
            prev.map(layer => ({
                ...layer,
                clients: layer.clients.map(client => 
                    layer.layer_id === layerId && client.client_project_id === clientProjectId
                        ? { ...client, [permission]: value }
                        : client
                ),
            }))
        );
    };

    const getCurrentPermission = (layerId: number, clientProjectId: number, permission: string): boolean => {
        const layer = permissionMatrix.find(l => l.layer_id === layerId);
        const client = layer?.clients.find(c => c.client_project_id === clientProjectId);
        return client ? client[permission as keyof typeof client] as boolean : false;
    };

    const handleSaveChanges = async () => {
        if (!selectedProject || pendingUpdates.size === 0) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const updates = Array.from(pendingUpdates.values());
            const result = await updateLayerPermissionMatrix(selectedProject as number, updates);
            
            setSuccess(`Successfully updated ${result.updated_count} permissions.`);
            setPendingUpdates(new Map());
            
            // Refresh matrix
            await loadPermissionMatrix(selectedProject as number);
        } catch (err) {
            setError('Failed to save permission changes. Please try again.');
            console.error('Error saving permissions:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleRefresh = () => {
        if (selectedProject) {
            loadPermissionMatrix(selectedProject as number);
        }
    };

    const getPermissionSummary = () => {
        if (!permissionMatrix.length) return { layers: 0, clients: 0, permissions: 0 };
        
        const layers = permissionMatrix.length;
        const clients = permissionMatrix[0]?.clients.length || 0;
        const permissions = permissionMatrix.reduce((total, layer) => 
            total + layer.clients.filter(c => c.can_view || c.can_edit || c.can_export).length, 0
        );
        
        return { layers, clients, permissions };
    };

    const summary = getPermissionSummary();

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Layer Permissions
                </Typography>
                <Box display="flex" gap={2}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading || !selectedProject}
                    >
                        Refresh
                    </Button>
                    {pendingUpdates.size > 0 && (
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                            onClick={handleSaveChanges}
                            disabled={saving}
                        >
                            Save Changes ({pendingUpdates.size})
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Project Selection */}
            <Box mb={3}>
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
            </Box>

            {/* Summary Cards */}
            {selectedProject && (
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <SecurityIcon color="primary" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{summary.layers}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Layers
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <SecurityIcon color="secondary" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{summary.clients}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Clients
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <SecurityIcon color="success" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{summary.permissions}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Active Permissions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

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

            {/* Permission Matrix */}
            {selectedProject && (
                <Paper>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                            <CircularProgress />
                        </Box>
                    ) : permissionMatrix.length === 0 ? (
                        <Box p={3} textAlign="center">
                            <Typography variant="h6" color="textSecondary">
                                No layers found for this project
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: '600px' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 200 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                Layer Name
                                            </Typography>
                                        </TableCell>
                                        {permissionMatrix[0]?.clients.map((client) => (
                                            <TableCell key={client.client_project_id} align="center" sx={{ minWidth: 150 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {client.client_name}
                                                </Typography>
                                                <Box display="flex" justifyContent="center" gap={0.5} mt={1}>
                                                    <Tooltip title="View">
                                                        <ViewIcon fontSize="small" color="action" />
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <EditIcon fontSize="small" color="action" />
                                                    </Tooltip>
                                                    <Tooltip title="Export">
                                                        <ExportIcon fontSize="small" color="action" />
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {permissionMatrix.map((layer) => (
                                        <TableRow key={layer.layer_id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {layer.layer_name}
                                                </Typography>
                                            </TableCell>
                                            {layer.clients.map((client) => (
                                                <TableCell key={client.client_project_id} align="center">
                                                    <Box display="flex" justifyContent="center" gap={1}>
                                                        <Checkbox
                                                            checked={client.can_view}
                                                            onChange={(e) => handlePermissionChange(
                                                                layer.layer_id,
                                                                client.client_project_id,
                                                                'can_view',
                                                                e.target.checked
                                                            )}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        <Checkbox
                                                            checked={client.can_edit}
                                                            onChange={(e) => handlePermissionChange(
                                                                layer.layer_id,
                                                                client.client_project_id,
                                                                'can_edit',
                                                                e.target.checked
                                                            )}
                                                            size="small"
                                                            color="secondary"
                                                        />
                                                        <Checkbox
                                                            checked={client.can_export}
                                                            onChange={(e) => handlePermissionChange(
                                                                layer.layer_id,
                                                                client.client_project_id,
                                                                'can_export',
                                                                e.target.checked
                                                            )}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {!selectedProject && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Select a Project to Manage Permissions
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Choose a project from the dropdown above to view and edit layer permissions for clients.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default LayerPermissionsPage;