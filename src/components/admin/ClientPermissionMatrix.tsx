import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    Switch,
    FormControlLabel,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Tooltip,
    Alert,
    Collapse,
    Grid,
    Tabs,
    Tab,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Visibility,
    Edit,
    Save,
    Cancel,
    ExpandMore,
    Settings,
    Security,
    Layers,
    Map,
    Analytics,
    Preview,
    Refresh,
    Download,
    Share,
    FilterList
} from '@mui/icons-material';
import { getProjects } from '../../services/projectService';
import { getClients } from '../../services/clientService';
import { Client, Project, Layer } from '../../types';

interface Permission {
    id: string;
    name: string;
    description: string;
    category: 'view' | 'edit' | 'admin' | 'layer' | 'export';
    icon: React.ReactNode;
}

interface ProjectPermission {
    projectId: number;
    permissionId: string;
    enabled: boolean;
    layerSpecific?: boolean;
    layerPermissions?: Record<string, boolean>;
}

interface PermissionTemplate {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, boolean>;
    layerPermissions?: Record<string, Record<string, boolean>>;
}

interface ClientPermissionMatrixProps {
    clientId?: number;
    onPermissionsChange?: (permissions: ProjectPermission[]) => void;
}

const PERMISSIONS: Permission[] = [
    { id: 'view', name: 'View Project', description: 'Can view the project', category: 'view', icon: <Visibility /> },
    { id: 'edit', name: 'Edit Features', description: 'Can edit map features', category: 'edit', icon: <Edit /> },
    { id: 'export', name: 'Export Data', description: 'Can export project data', category: 'export', icon: <Download /> },
    { id: 'share', name: 'Share Project', description: 'Can share project with others', category: 'admin', icon: <Share /> },
    { id: 'analytics', name: 'View Analytics', description: 'Can view project analytics', category: 'view', icon: <Analytics /> },
    { id: 'layer_toggle', name: 'Toggle Layers', description: 'Can show/hide layers', category: 'layer', icon: <Layers /> },
    { id: 'layer_style', name: 'Edit Layer Styles', description: 'Can modify layer appearance', category: 'layer', icon: <Settings /> },
    { id: 'map_tools', name: 'Use Map Tools', description: 'Can use measurement and drawing tools', category: 'edit', icon: <Map /> }
];

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
    {
        id: 'viewer',
        name: 'Viewer Only',
        description: 'Basic viewing permissions',
        permissions: {
            view: true,
            edit: false,
            export: false,
            share: false,
            analytics: false,
            layer_toggle: true,
            layer_style: false,
            map_tools: false
        }
    },
    {
        id: 'editor',
        name: 'Editor',
        description: 'Editing permissions with some restrictions',
        permissions: {
            view: true,
            edit: true,
            export: true,
            share: false,
            analytics: false,
            layer_toggle: true,
            layer_style: false,
            map_tools: true
        }
    },
    {
        id: 'collaborator',
        name: 'Collaborator',
        description: 'Full collaboration permissions',
        permissions: {
            view: true,
            edit: true,
            export: true,
            share: true,
            analytics: true,
            layer_toggle: true,
            layer_style: true,
            map_tools: true
        }
    }
];

const ClientPermissionMatrix: React.FC<ClientPermissionMatrixProps> = ({
    clientId,
    onPermissionsChange
}) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | null>(clientId || null);
    const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewChanges, setPreviewChanges] = useState<ProjectPermission[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [templateDialog, setTemplateDialog] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState(0);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            loadClientPermissions();
        }
    }, [selectedClient]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [projectsRes, clientsRes] = await Promise.all([
                getProjects(),
                getClients()
            ]);
            setProjects(projectsRes.results || []);
            setClients(clientsRes.results || []);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadClientPermissions = async () => {
        if (!selectedClient) return;
        
        setLoading(true);
        try {
            const defaultPermissions = projects.map(project => ({
                projectId: project.id,
                permissionId: '',
                enabled: false,
                layerPermissions: project.layers?.reduce((acc, layer) => {
                    acc[layer.id] = false;
                    return acc;
                }, {} as Record<string, boolean>) || {}
            }));
            
            setPermissions(defaultPermissions);
        } catch (err) {
            setError('Failed to load client permissions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (projectId: number, permissionId: string, enabled: boolean) => {
        const newPermissions = permissions.map(p => 
            p.projectId === projectId 
                ? { ...p, [permissionId]: enabled }
                : p
        );
        setPermissions(newPermissions);
        setHasChanges(true);
        
        if (previewMode) {
            setPreviewChanges(newPermissions);
        }
    };

    const handleLayerPermissionChange = (projectId: number, layerId: string, permissionId: string, enabled: boolean) => {
        const newPermissions = permissions.map(p => 
            p.projectId === projectId 
                ? {
                    ...p,
                    layerPermissions: {
                        ...p.layerPermissions,
                        [`${layerId}_${permissionId}`]: enabled
                    }
                }
                : p
        );
        setPermissions(newPermissions);
        setHasChanges(true);
    };

    const applyTemplate = (templateId: string, projectIds: number[]) => {
        const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        const newPermissions = permissions.map(p => {
            if (projectIds.includes(p.projectId)) {
                const updatedPermission = { ...p };
                Object.entries(template.permissions).forEach(([permId, enabled]) => {
                    (updatedPermission as any)[permId] = enabled;
                });
                return updatedPermission;
            }
            return p;
        });

        setPermissions(newPermissions);
        setHasChanges(true);
        setTemplateDialog(false);
        setSelectedProjects(new Set());
    };

    const toggleProjectExpansion = (projectId: number) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            onPermissionsChange?.(permissions);
            setHasChanges(false);
            setPreviewMode(false);
        } catch (err) {
            setError('Failed to save permissions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewToggle = () => {
        if (previewMode) {
            setPreviewChanges([]);
        } else {
            setPreviewChanges([...permissions]);
        }
        setPreviewMode(!previewMode);
    };

    const filteredPermissions = PERMISSIONS.filter(p => 
        filterCategory === 'all' || p.category === filterCategory
    );

    const getPermissionValue = (projectId: number, permissionId: string) => {
        const permission = permissions.find(p => p.projectId === projectId);
        return (permission as any)?.[permissionId] || false;
    };

    const getLayerPermissionValue = (projectId: number, layerId: string, permissionId: string) => {
        const permission = permissions.find(p => p.projectId === projectId);
        return permission?.layerPermissions?.[`${layerId}_${permissionId}`] || false;
    };

    const renderMatrixView = () => (
        <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Checkbox
                                    indeterminate={selectedProjects.size > 0 && selectedProjects.size < projects.length}
                                    checked={selectedProjects.size === projects.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedProjects(new Set(projects.map(p => p.id)));
                                        } else {
                                            setSelectedProjects(new Set());
                                        }
                                    }}
                                />
                                <Typography variant="subtitle2">Project</Typography>
                            </Box>
                        </TableCell>
                        {filteredPermissions.map(permission => (
                            <TableCell key={permission.id} align="center">
                                <Tooltip title={permission.description}>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                        {permission.icon}
                                        <Typography variant="caption" textAlign="center">
                                            {permission.name}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </TableCell>
                        ))}
                        <TableCell align="center">
                            <Typography variant="subtitle2">Actions</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.map(project => (
                        <React.Fragment key={project.id}>
                            <TableRow hover>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Checkbox
                                            checked={selectedProjects.has(project.id)}
                                            onChange={(e) => {
                                                const newSelected = new Set(selectedProjects);
                                                if (e.target.checked) {
                                                    newSelected.add(project.id);
                                                } else {
                                                    newSelected.delete(project.id);
                                                }
                                                setSelectedProjects(newSelected);
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {project.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {project.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                {filteredPermissions.map(permission => (
                                    <TableCell key={permission.id} align="center">
                                        <Switch
                                            size="small"
                                            checked={getPermissionValue(project.id, permission.id)}
                                            onChange={(e) => handlePermissionChange(
                                                project.id,
                                                permission.id,
                                                e.target.checked
                                            )}
                                            color={previewMode ? 'secondary' : 'primary'}
                                        />
                                    </TableCell>
                                ))}
                                <TableCell align="center">
                                    <Tooltip title="Layer Permissions">
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleProjectExpansion(project.id)}
                                        >
                                            <ExpandMore 
                                                sx={{ 
                                                    transform: expandedProjects.has(project.id) 
                                                        ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s'
                                                }}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                            
                            <TableRow>
                                <TableCell 
                                    colSpan={filteredPermissions.length + 2} 
                                    sx={{ py: 0, border: 0 }}
                                >
                                    <Collapse in={expandedProjects.has(project.id)}>
                                        <Box sx={{ py: 2, pl: 4, bgcolor: 'action.hover' }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Layer-Specific Permissions
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {project.layers?.map(layer => (
                                                    <Grid item xs={12} md={6} key={layer.id}>
                                                        <Card variant="outlined" size="small">
                                                            <CardContent sx={{ py: 1 }}>
                                                                <Typography variant="body2" gutterBottom>
                                                                    {layer.name}
                                                                </Typography>
                                                                <Box display="flex" gap={1} flexWrap="wrap">
                                                                    {['view', 'edit', 'style'].map(layerPerm => (
                                                                        <FormControlLabel
                                                                            key={layerPerm}
                                                                            control={
                                                                                <Checkbox
                                                                                    size="small"
                                                                                    checked={getLayerPermissionValue(
                                                                                        project.id, 
                                                                                        layer.id, 
                                                                                        layerPerm
                                                                                    )}
                                                                                    onChange={(e) => handleLayerPermissionChange(
                                                                                        project.id,
                                                                                        layer.id,
                                                                                        layerPerm,
                                                                                        e.target.checked
                                                                                    )}
                                                                                />
                                                                            }
                                                                            label={
                                                                                <Typography variant="caption">
                                                                                    {layerPerm}
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderCategoryView = () => (
        <Grid container spacing={3}>
            {['view', 'edit', 'layer', 'admin', 'export'].map(category => {
                const categoryPermissions = PERMISSIONS.filter(p => p.category === category);
                return (
                    <Grid item xs={12} md={6} key={category}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                    {category} Permissions
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {categoryPermissions.map(permission => (
                                        <Box key={permission.id}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {permission.icon}
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {permission.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {permission.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption">
                                                    {projects.filter(p => getPermissionValue(p.id, permission.id)).length}/{projects.length} projects
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                );
            })}
        </Grid>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Permission Matrix</Typography>
                <Box display="flex" gap={1}>
                    {hasChanges && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<Preview />}
                            onClick={handlePreviewToggle}
                        >
                            {previewMode ? 'Exit Preview' : 'Preview Changes'}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={!hasChanges || loading}
                    >
                        Save Changes
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {previewMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Preview mode is active. Changes are shown but not saved yet.
                </Alert>
            )}

            <Paper sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Client</InputLabel>
                            <Select
                                value={selectedClient || ''}
                                onChange={(e) => setSelectedClient(e.target.value as number)}
                                label="Client"
                            >
                                {clients.map(client => (
                                    <MenuItem key={client.id} value={client.id}>
                                        {client.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Filter Category</InputLabel>
                            <Select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                label="Filter Category"
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                <MenuItem value="view">View</MenuItem>
                                <MenuItem value="edit">Edit</MenuItem>
                                <MenuItem value="layer">Layer</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="export">Export</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" gap={1} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                startIcon={<Settings />}
                                onClick={() => setTemplateDialog(true)}
                                disabled={selectedProjects.size === 0}
                            >
                                Apply Template
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={loadClientPermissions}
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                {selectedProjects.size > 0 && (
                    <Box mt={2}>
                        <Chip
                            label={`${selectedProjects.size} projects selected`}
                            onDelete={() => setSelectedProjects(new Set())}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="Matrix View" />
                    <Tab label="Category View" />
                </Tabs>
            </Box>

            {selectedClient ? (
                <>
                    {activeTab === 0 && renderMatrixView()}
                    {activeTab === 1 && renderCategoryView()}
                </>
            ) : (
                <Alert severity="info">
                    Please select a client to view and edit permissions
                </Alert>
            )}

            <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)}>
                <DialogTitle>Apply Permission Template</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, minWidth: 400 }}>
                        <FormControl fullWidth mb={2}>
                            <InputLabel>Select Template</InputLabel>
                            <Select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                label="Select Template"
                            >
                                {PERMISSION_TEMPLATES.map(template => (
                                    <MenuItem key={template.id} value={template.id}>
                                        <Box>
                                            <Typography variant="body2">{template.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {template.description}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        {selectedTemplate && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Template Preview:
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {Object.entries(
                                        PERMISSION_TEMPLATES.find(t => t.id === selectedTemplate)?.permissions || {}
                                    ).map(([permId, enabled]) => (
                                        <Chip
                                            key={permId}
                                            label={PERMISSIONS.find(p => p.id === permId)?.name || permId}
                                            color={enabled ? 'success' : 'default'}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={() => applyTemplate(selectedTemplate, Array.from(selectedProjects))}
                        variant="contained"
                        disabled={!selectedTemplate}
                    >
                        Apply Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClientPermissionMatrix;