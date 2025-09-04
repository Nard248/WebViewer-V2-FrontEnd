import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    IconButton,
    Chip,
    Grid,
    Card,
    CardContent,
    CardActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    TextField,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    AlertTitle,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Avatar,
    AvatarGroup,
    Badge,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    Snackbar,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Map as MapIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    Layers as LayersIcon,
    Functions as FunctionsIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon,
    Dataset as DatasetIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    DragIndicator as DragIcon,
    ContentCopy as CopyIcon,
    Link as LinkIcon,
    AccessTime as AccessTimeIcon,
    PersonAdd as PersonAddIcon,
    GroupAdd as GroupAddIcon,
    AdminPanelSettings as AdminIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getAdminProjectDetail, AdminProjectDetail } from '../../../services/adminProjectService';
import MapLoadingAnimation from '../../../components/ui/MapLoadingAnimation';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`project-tabpanel-${index}`}
            aria-labelledby={`project-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<AdminProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    
    // Edit state
    const [editedProject, setEditedProject] = useState<Partial<AdminProjectDetail>>({});
    
    // Dialog states
    const [clientDialog, setClientDialog] = useState(false);
    const [layerGroupDialog, setLayerGroupDialog] = useState(false);
    const [layerDialog, setLayerDialog] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; type: string; item: any }>({
        open: false,
        type: '',
        item: null
    });

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            const data = await getAdminProjectDetail(parseInt(projectId!));
            setProject(data);
            setEditedProject(data);
        } catch (err) {
            setError('Failed to load project details');
            console.error('Error fetching project details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
        } catch {
            return dateString;
        }
    };

    const handleSaveChanges = async () => {
        // TODO: Implement save functionality with API
        setSnackbar({ open: true, message: 'Changes saved successfully', severity: 'success' });
        setEditMode(false);
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        setSnackbar({ open: true, message: 'Link copied to clipboard', severity: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <MapLoadingAnimation size="large" message="Loading project details..." />
            </Box>
        );
    }

    if (error || !project) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    {error || 'Project not found'}
                </Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/projects')} sx={{ mt: 2 }}>
                    Back to Projects
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <IconButton 
                                onClick={() => navigate('/admin/projects')} 
                                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {project.name}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {project.description || 'No description provided'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            icon={project.is_active ? <ActiveIcon /> : <InactiveIcon />}
                            label={project.is_active ? 'Active' : 'Inactive'}
                            color={project.is_active ? 'success' : 'error'}
                            sx={{ bgcolor: 'white' }}
                        />
                        <Chip
                            icon={project.is_public ? <PublicIcon /> : <LockIcon />}
                            label={project.is_public ? 'Public' : 'Private'}
                            sx={{ bgcolor: 'white' }}
                        />
                    </Box>
                </Box>
                
                {/* Quick Stats */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LocationIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            <Box>
                                <Typography variant="h5">{project.state_name}</Typography>
                                <Typography variant="caption">Location</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LayersIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            <Box>
                                <Typography variant="h5">{project.stats.total_layers}</Typography>
                                <Typography variant="caption">Total Layers</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            <Box>
                                <Typography variant="h5">{project.assigned_clients.length}</Typography>
                                <Typography variant="caption">Assigned Clients</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DatasetIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                            <Box>
                                <Typography variant="h5">{project.stats.total_features.toLocaleString()}</Typography>
                                <Typography variant="caption">Total Features</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {!editMode ? (
                    <>
                        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                            Edit Project
                        </Button>
                        <Button variant="outlined" startIcon={<MapIcon />} onClick={() => window.open(`/viewer/${project.id}`, '_blank')}>
                            View Map
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>
                            Cancel
                        </Button>
                    </>
                )}
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    <Tab icon={<InfoIcon />} label="Overview" />
                    <Tab icon={<LayersIcon />} label="Layers & Groups" />
                    <Tab icon={<PeopleIcon />} label="Client Access" />
                    <Tab icon={<FunctionsIcon />} label="Functions" />
                    <Tab icon={<SettingsIcon />} label="Map Settings" />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
                {/* Overview Tab */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoIcon /> Basic Information
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Project Name"
                                        secondary={editMode ? (
                                            <TextField 
                                                value={editedProject.name} 
                                                onChange={(e) => setEditedProject({...editedProject, name: e.target.value})}
                                                fullWidth
                                                size="small"
                                            />
                                        ) : project.name}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Project Type"
                                        secondary={editMode ? (
                                            <Select
                                                value={editedProject.project_type}
                                                onChange={(e) => setEditedProject({...editedProject, project_type: e.target.value})}
                                                size="small"
                                                fullWidth
                                            >
                                                <MenuItem value="Test-Maps">Test-Maps</MenuItem>
                                                <MenuItem value="Production">Production</MenuItem>
                                                <MenuItem value="Development">Development</MenuItem>
                                            </Select>
                                        ) : project.project_type}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="State"
                                        secondary={`${project.state_name} (${project.state_abbr})`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Description"
                                        secondary={editMode ? (
                                            <TextField 
                                                value={editedProject.description || ''} 
                                                onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
                                                fullWidth
                                                multiline
                                                rows={3}
                                                size="small"
                                            />
                                        ) : (project.description || 'No description')}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Status"
                                        secondary={editMode ? (
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={editedProject.is_active}
                                                        onChange={(e) => setEditedProject({...editedProject, is_active: e.target.checked})}
                                                    />
                                                }
                                                label={editedProject.is_active ? 'Active' : 'Inactive'}
                                            />
                                        ) : (
                                            <Chip
                                                icon={project.is_active ? <ActiveIcon /> : <InactiveIcon />}
                                                label={project.is_active ? 'Active' : 'Inactive'}
                                                color={project.is_active ? 'success' : 'error'}
                                                size="small"
                                            />
                                        )}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Visibility"
                                        secondary={editMode ? (
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={editedProject.is_public}
                                                        onChange={(e) => setEditedProject({...editedProject, is_public: e.target.checked})}
                                                    />
                                                }
                                                label={editedProject.is_public ? 'Public' : 'Private'}
                                            />
                                        ) : (
                                            <Chip
                                                icon={project.is_public ? <PublicIcon /> : <LockIcon />}
                                                label={project.is_public ? 'Public' : 'Private'}
                                                size="small"
                                            />
                                        )}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AdminIcon /> Creator & Metadata
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {project.creator_info.full_name.charAt(0)}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Created By"
                                        secondary={`${project.creator_info.full_name} (${project.creator_info.email})`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Created At"
                                        secondary={formatDate(project.created_at)}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Last Updated"
                                        secondary={formatDate(project.updated_at)}
                                    />
                                </ListItem>
                                {project.public_access_token && (
                                    <ListItem>
                                        <ListItemText 
                                            primary="Public Access Token"
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                        {project.public_access_token}
                                                    </Typography>
                                                    <IconButton size="small" onClick={() => handleCopyLink(project.public_access_token!)}>
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="h6" gutterBottom>Statistics</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                                        <Typography variant="h4" color="white">{project.stats.layer_groups_count}</Typography>
                                        <Typography variant="caption" color="white">Layer Groups</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                                        <Typography variant="h4" color="white">{project.stats.total_layers}</Typography>
                                        <Typography variant="caption" color="white">Total Layers</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                                        <Typography variant="h4" color="white">{project.stats.public_layers}</Typography>
                                        <Typography variant="caption" color="white">Public Layers</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                                        <Typography variant="h4" color="white">{project.stats.active_functions}</Typography>
                                        <Typography variant="caption" color="white">Active Functions</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {/* Layers & Groups Tab */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Layer Groups & Layers</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setLayerGroupDialog(true)}
                    >
                        Add Layer Group
                    </Button>
                </Box>
                
                {project.layer_groups.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center' }}>
                        <LayersIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No Layer Groups</Typography>
                        <Typography color="text.secondary">Start by creating your first layer group</Typography>
                    </Paper>
                ) : (
                    project.layer_groups.map((group) => (
                        <Accordion key={group.id} sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                    <DragIcon sx={{ color: 'text.secondary' }} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6">{group.name}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                            <Chip 
                                                size="small" 
                                                label={`${group.layers.length} layers`}
                                                color="primary"
                                            />
                                            <Chip 
                                                size="small" 
                                                icon={group.is_visible_by_default ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                label={group.is_visible_by_default ? 'Visible' : 'Hidden'}
                                            />
                                            <Chip 
                                                size="small" 
                                                label={`Order: ${group.display_order}`}
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton 
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLayerDialog(true);
                                            }}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmDialog({ open: true, type: 'layerGroup', item: group });
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {group.layers.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">No layers in this group</Typography>
                                        <Button startIcon={<AddIcon />} sx={{ mt: 2 }}>Add Layer</Button>
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Layer Name</TableCell>
                                                    <TableCell>Type</TableCell>
                                                    <TableCell align="right">Features</TableCell>
                                                    <TableCell>Visibility</TableCell>
                                                    <TableCell>Functions</TableCell>
                                                    <TableCell align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {group.layers.map((layer) => (
                                                    <TableRow key={layer.id}>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {layer.name}
                                                                </Typography>
                                                                {layer.description && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {layer.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{layer.layer_type}</TableCell>
                                                        <TableCell align="right">{layer.feature_count.toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                <Chip 
                                                                    size="small" 
                                                                    icon={layer.is_visible_by_default ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                                    label={layer.is_visible_by_default ? 'Visible' : 'Hidden'}
                                                                    variant="outlined"
                                                                />
                                                                {layer.is_public && (
                                                                    <Chip 
                                                                        size="small" 
                                                                        icon={<PublicIcon />}
                                                                        label="Public"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            {layer.functions.length > 0 ? (
                                                                <Tooltip title={layer.functions.map(f => f.name).join(', ')}>
                                                                    <Chip 
                                                                        size="small" 
                                                                        label={`${layer.functions.filter(f => f.enabled).length}/${layer.functions.length}`}
                                                                        color="secondary"
                                                                    />
                                                                </Tooltip>
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary">None</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <IconButton size="small">
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton 
                                                                size="small" 
                                                                color="error"
                                                                onClick={() => setDeleteConfirmDialog({ open: true, type: 'layer', item: layer })}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                {/* Client Access Tab */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Client Access Management</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<PersonAddIcon />}
                        onClick={() => setClientDialog(true)}
                    >
                        Assign Client
                    </Button>
                </Box>

                {project.assigned_clients.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No Assigned Clients</Typography>
                        <Typography color="text.secondary">Assign clients to grant them access to this project</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {project.assigned_clients.map((assignment) => (
                            <Grid item xs={12} md={6} key={assignment.client_id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="h6">{assignment.client_name}</Typography>
                                                <Chip 
                                                    label={assignment.access_level} 
                                                    size="small" 
                                                    color="primary"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                            <IconButton 
                                                color="error"
                                                onClick={() => setDeleteConfirmDialog({ open: true, type: 'client', item: assignment })}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                        
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon><LinkIcon /></ListItemIcon>
                                                <ListItemText 
                                                    primary="Unique Link"
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography 
                                                                variant="caption" 
                                                                sx={{ 
                                                                    fontFamily: 'monospace',
                                                                    bgcolor: 'grey.100',
                                                                    p: 0.5,
                                                                    borderRadius: 1
                                                                }}
                                                            >
                                                                {assignment.unique_link}
                                                            </Typography>
                                                            <IconButton 
                                                                size="small"
                                                                onClick={() => handleCopyLink(`${window.location.origin}/client/${assignment.unique_link}`)}
                                                            >
                                                                <CopyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon><AccessTimeIcon /></ListItemIcon>
                                                <ListItemText 
                                                    primary="Access Times"
                                                    secondary={
                                                        <>
                                                            <Typography variant="caption" display="block">
                                                                Created: {formatDate(assignment.created_at)}
                                                            </Typography>
                                                            {assignment.expires_at && (
                                                                <Typography variant="caption" display="block" color="error">
                                                                    Expires: {formatDate(assignment.expires_at)}
                                                                </Typography>
                                                            )}
                                                            {assignment.last_accessed && (
                                                                <Typography variant="caption" display="block">
                                                                    Last accessed: {formatDate(assignment.last_accessed)}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        </List>

                                        {assignment.users.length > 0 && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Users ({assignment.users.length})
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {assignment.users.map((user) => (
                                                        <Box 
                                                            key={user.id}
                                                            sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: 1,
                                                                p: 1,
                                                                bgcolor: 'grey.50',
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                                {user.full_name.charAt(0)}
                                                            </Avatar>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography variant="body2">{user.full_name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {user.email} • {user.client_role}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                {/* Functions Tab */}
                <Typography variant="h5" gutterBottom>Project Functions</Typography>
                <Grid container spacing={3}>
                    {project.project_functions.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 6, textAlign: 'center' }}>
                                <FunctionsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>No Functions Configured</Typography>
                                <Typography color="text.secondary">Add functions to enhance your project's capabilities</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        project.project_functions.map((func) => (
                            <Grid item xs={12} sm={6} md={4} key={func.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6">{func.name}</Typography>
                                            {func.is_system && (
                                                <Chip label="System" size="small" color="secondary" />
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {func.description || 'No description'}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Chip 
                                                label={func.function_type} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small">Configure</Button>
                                        {!func.is_system && (
                                            <Button size="small" color="error">Remove</Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
                {/* Map Settings Tab */}
                <Typography variant="h5" gutterBottom>Map Configuration</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Default View Settings</Typography>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Center Latitude"
                                        secondary={editMode ? (
                                            <TextField 
                                                type="number"
                                                value={editedProject.default_center_lat || ''} 
                                                onChange={(e) => setEditedProject({...editedProject, default_center_lat: parseFloat(e.target.value)})}
                                                fullWidth
                                                size="small"
                                            />
                                        ) : (project.default_center_lat || 'Not set')}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Center Longitude"
                                        secondary={editMode ? (
                                            <TextField 
                                                type="number"
                                                value={editedProject.default_center_lng || ''} 
                                                onChange={(e) => setEditedProject({...editedProject, default_center_lng: parseFloat(e.target.value)})}
                                                fullWidth
                                                size="small"
                                            />
                                        ) : (project.default_center_lng || 'Not set')}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Default Zoom Level"
                                        secondary={editMode ? (
                                            <TextField 
                                                type="number"
                                                value={editedProject.default_zoom_level || ''} 
                                                onChange={(e) => setEditedProject({...editedProject, default_zoom_level: parseInt(e.target.value)})}
                                                fullWidth
                                                size="small"
                                                inputProps={{ min: 1, max: 20 }}
                                            />
                                        ) : (project.default_zoom_level || 10)}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Zoom Constraints</Typography>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Minimum Zoom"
                                        secondary={editMode ? (
                                            <TextField 
                                                type="number"
                                                value={editedProject.min_zoom || 1} 
                                                onChange={(e) => setEditedProject({...editedProject, min_zoom: parseInt(e.target.value)})}
                                                fullWidth
                                                size="small"
                                                inputProps={{ min: 1, max: 20 }}
                                            />
                                        ) : (project.min_zoom || 1)}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Maximum Zoom"
                                        secondary={editMode ? (
                                            <TextField 
                                                type="number"
                                                value={editedProject.max_zoom || 18} 
                                                onChange={(e) => setEditedProject({...editedProject, max_zoom: parseInt(e.target.value)})}
                                                fullWidth
                                                size="small"
                                                inputProps={{ min: 1, max: 20 }}
                                            />
                                        ) : (project.max_zoom || 18)}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Map Controls</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configure which controls are available on the map
                            </Typography>
                            {/* TODO: Add map control configuration UI */}
                        </Paper>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmDialog.open} onClose={() => setDeleteConfirmDialog({ open: false, type: '', item: null })}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this {deleteConfirmDialog.type}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmDialog({ open: false, type: '', item: null })}>
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={() => {
                        // TODO: Implement delete functionality
                        setSnackbar({ open: true, message: `${deleteConfirmDialog.type} deleted successfully`, severity: 'success' });
                        setDeleteConfirmDialog({ open: false, type: '', item: null });
                    }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProjectDetailPage;