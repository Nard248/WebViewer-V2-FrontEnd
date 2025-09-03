import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    CardMedia,
    Typography,
    Button,
    IconButton,
    Avatar,
    Chip,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    Switch,
    FormControlLabel,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    InputAdornment,
    Skeleton,
    Badge,
    Tooltip,
    LinearProgress,
    Fab,
    Menu,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    ViewModule,
    ViewList,
    Search,
    FilterList,
    Launch,
    AccessTime,
    TrendingUp,
    Notifications,
    Settings,
    Download,
    Share,
    Visibility,
    MoreVert,
    Add,
    CalendarToday,
    Analytics,
    PieChart,
    Timeline,
    Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import { clientWorkspaceService, ClientDashboardData, ClientProjectAccess, ProjectFilters } from '../../services/clientWorkspaceService';
import { withClientPermissions } from '../../components/client/withClientPermissions';

type ViewMode = 'grid' | 'list';

interface ProjectCardProps {
    project: ClientProjectAccess;
    viewMode: ViewMode;
    onOpen: (projectId: number) => void;
    onShare?: (projectId: number) => void;
    onExport?: (projectId: number) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, viewMode, onOpen, onShare, onExport }) => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const getExpirationColor = () => {
        if (!project.expiresAt) return 'default';
        const now = new Date();
        const expiresAt = new Date(project.expiresAt);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) return 'error';
        if (daysUntilExpiry < 7) return 'warning';
        if (daysUntilExpiry < 30) return 'info';
        return 'success';
    };

    const formatLastAccessed = (lastAccessed: string | null) => {
        if (!lastAccessed) return 'Never accessed';
        const date = new Date(lastAccessed);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    };

    if (viewMode === 'list') {
        return (
            <Card sx={{ mb: 1 }}>
                <CardContent sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                            src={`/api/project-thumbnail/${project.projectId}`}
                            sx={{ width: 48, height: 48 }}
                        >
                            {project.projectName.charAt(0)}
                        </Avatar>
                        
                        <Box flexGrow={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Typography variant="h6" noWrap>
                                    {project.projectName}
                                </Typography>
                                {!project.isActive && (
                                    <Chip label="Inactive" size="small" color="default" />
                                )}
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={2}>
                                <Typography variant="caption" color="text.secondary">
                                    Last accessed: {formatLastAccessed(project.lastAccessed)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {project.accessCount} visits
                                </Typography>
                                {project.expiresAt && (
                                    <Chip
                                        label={`Expires ${new Date(project.expiresAt).toLocaleDateString()}`}
                                        size="small"
                                        color={getExpirationColor()}
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Box>

                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => onOpen(project.projectId)}
                                startIcon={<Launch />}
                            >
                                Open
                            </Button>
                            <IconButton onClick={handleMenuOpen}>
                                <MoreVert />
                            </IconButton>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
                component="img"
                height="160"
                image={`/api/project-thumbnail/${project.projectId}`}
                alt={project.projectName}
                sx={{ bgcolor: 'grey.200' }}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder/300/160';
                }}
            />
            
            <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" component="h3" noWrap title={project.projectName}>
                        {project.projectName}
                    </Typography>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVert />
                    </IconButton>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {!project.isActive && (
                        <Chip label="Inactive" size="small" color="default" />
                    )}
                    {project.permissions.canEdit && (
                        <Chip label="Can Edit" size="small" color="success" variant="outlined" />
                    )}
                    {project.permissions.canExport && (
                        <Chip label="Can Export" size="small" color="info" variant="outlined" />
                    )}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last accessed: {formatLastAccessed(project.lastAccessed)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    {project.accessCount} visits
                </Typography>

                {project.expiresAt && (
                    <Box mt={1}>
                        <Chip
                            label={`Expires ${new Date(project.expiresAt).toLocaleDateString()}`}
                            size="small"
                            color={getExpirationColor()}
                            variant="outlined"
                            fullWidth
                        />
                    </Box>
                )}
            </CardContent>

            <CardActions>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => onOpen(project.projectId)}
                    startIcon={<Launch />}
                >
                    Open Project
                </Button>
            </CardActions>

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                {project.permissions.canExport && (
                    <MenuItem onClick={() => { onExport?.(project.projectId); handleMenuClose(); }}>
                        <Download sx={{ mr: 1 }} />
                        Export Data
                    </MenuItem>
                )}
                {project.permissions.canShare && (
                    <MenuItem onClick={() => { onShare?.(project.projectId); handleMenuClose(); }}>
                        <Share sx={{ mr: 1 }} />
                        Share Project
                    </MenuItem>
                )}
                <MenuItem onClick={() => { onOpen(project.projectId); handleMenuClose(); }}>
                    <Visibility sx={{ mr: 1 }} />
                    View Details
                </MenuItem>
            </Menu>
        </Card>
    );
};

const ClientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useClientAuth();
    
    const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
    const [projects, setProjects] = useState<ClientProjectAccess[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRecentActivity, setShowRecentActivity] = useState(true);
    const [showStatistics, setShowStatistics] = useState(true);
    const [loading, setLoading] = useState(true);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        loadProjects();
    }, [searchTerm]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await clientWorkspaceService.getDashboard();
            setDashboardData(data);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async () => {
        setProjectsLoading(true);
        try {
            const filters: ProjectFilters = {
                search: searchTerm || undefined,
                status: 'all',
                sortBy: 'lastAccessed',
                sortOrder: 'desc',
                limit: 50
            };
            
            const response = await clientWorkspaceService.getProjects(filters);
            setProjects(response.results);
        } catch (err) {
            console.error('Error loading projects:', err);
        } finally {
            setProjectsLoading(false);
        }
    };

    const handleProjectOpen = (projectId: number) => {
        navigate(`/client/projects/${projectId}`);
    };

    const handleProjectExport = async (projectId: number) => {
        try {
            const blob = await clientWorkspaceService.exportData({
                format: 'csv',
                projectId,
                includeMetadata: true,
                includeGeometry: true
            });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${projectId}-export.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleProjectShare = async (projectId: number) => {
        try {
            const response = await clientWorkspaceService.shareProject({
                projectId,
                shareType: 'link',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            });
            
            navigator.clipboard.writeText(response.shareUrl);
            // Show success message
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {[...Array(8)].map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                            <Card>
                                <Skeleton variant="rectangular" height={160} />
                                <CardContent>
                                    <Skeleton variant="text" />
                                    <Skeleton variant="text" width="60%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Welcome back, {user?.firstName}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {user?.clientName} • {dashboardData?.projectCount || 0} projects
                    </Typography>
                </Box>
                
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadDashboard}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Settings />}
                        onClick={() => navigate('/client/profile')}
                    >
                        Settings
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            {showStatistics && dashboardData && (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Projects
                                        </Typography>
                                        <Typography variant="h4">
                                            {dashboardData.projectCount}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        <Analytics />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Sessions
                                        </Typography>
                                        <Typography variant="h4">
                                            {dashboardData.accessStatistics.totalSessions}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                        <TrendingUp />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Avg Session
                                        </Typography>
                                        <Typography variant="h4">
                                            {dashboardData.accessStatistics.avgSessionDuration}m
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                        <AccessTime />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Notifications
                                        </Typography>
                                        <Typography variant="h4">
                                            {dashboardData.notifications.filter(n => !n.read).length}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                        <Notifications />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Grid container spacing={3}>
                {/* Projects Section */}
                <Grid item xs={12} lg={showRecentActivity ? 8 : 12}>
                    <Paper sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h5">Your Projects</Typography>
                            
                            <Box display="flex" gap={1} alignItems="center">
                                <TextField
                                    size="small"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                
                                {!isMobile && (
                                    <ToggleButtonGroup
                                        value={viewMode}
                                        exclusive
                                        onChange={(_, newViewMode) => newViewMode && setViewMode(newViewMode)}
                                        size="small"
                                    >
                                        <ToggleButton value="grid">
                                            <ViewModule />
                                        </ToggleButton>
                                        <ToggleButton value="list">
                                            <ViewList />
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                )}
                            </Box>
                        </Box>

                        {projectsLoading && (
                            <LinearProgress sx={{ mb: 2 }} />
                        )}

                        {filteredProjects.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No projects found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any projects assigned yet.'}
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {filteredProjects.map((project) => (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={viewMode === 'grid' ? 6 : 12}
                                        md={viewMode === 'grid' ? 4 : 12}
                                        lg={viewMode === 'grid' ? 3 : 12}
                                        key={project.projectId}
                                    >
                                        <ProjectCard
                                            project={project}
                                            viewMode={viewMode}
                                            onOpen={handleProjectOpen}
                                            onExport={handleProjectExport}
                                            onShare={handleProjectShare}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                {showRecentActivity && dashboardData && (
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, height: 'fit-content' }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Activity
                            </Typography>
                            
                            <List>
                                {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                                    <React.Fragment key={activity.id}>
                                        <ListItem sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                    {activity.actionType === 'login' && <Launch />}
                                                    {activity.actionType === 'project_view' && <Visibility />}
                                                    {activity.actionType === 'data_export' && <Download />}
                                                    {activity.actionType === 'feature_edit' && <Analytics />}
                                                    {activity.actionType === 'share' && <Share />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={activity.action}
                                                secondary={new Date(activity.timestamp).toLocaleString()}
                                            />
                                        </ListItem>
                                        {index < dashboardData.recentActivity.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => navigate('/client/activity')}
                                sx={{ mt: 2 }}
                            >
                                View All Activity
                            </Button>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Dashboard Settings */}
            <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Dashboard Settings
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showRecentActivity}
                                onChange={(e) => setShowRecentActivity(e.target.checked)}
                            />
                        }
                        label="Show Recent Activity"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showStatistics}
                                onChange={(e) => setShowStatistics(e.target.checked)}
                            />
                        }
                        label="Show Statistics"
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default withClientPermissions(ClientDashboard, {
    requiredPermissions: ['canView'],
    showLoading: true
});