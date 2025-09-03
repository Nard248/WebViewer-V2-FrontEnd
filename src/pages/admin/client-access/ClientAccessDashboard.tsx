import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Avatar,
    LinearProgress,
    Tooltip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
    Tabs,
    Tab,
    Badge,
    Divider
} from '@mui/material';
import {
    Search,
    FilterList,
    MoreVert,
    Visibility,
    Edit,
    Block,
    CheckCircle,
    Cancel,
    AccessTime,
    TrendingUp,
    TrendingDown,
    People,
    Assignment,
    Analytics,
    Warning,
    Info,
    Launch,
    History,
    Schedule,
    Download,
    Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getClients } from '../../../services/clientService';
import { getProjects } from '../../../services/projectService';
import { Client, ClientProject, ClientAnalytics } from '../../../types';

interface ClientAccessStats {
    totalClients: number;
    activeClients: number;
    totalProjects: number;
    activeProjects: number;
    totalUsers: number;
    activeUsers: number;
    recentActivities: any[];
}

interface ClientWithStats extends Client {
    projectCount: number;
    activeProjectCount: number;
    userCount: number;
    activeUserCount: number;
    lastAccess: Date | null;
    totalAccesses: number;
    avgSessionDuration: number;
    mostAccessedProject?: string;
    accessTrend: 'up' | 'down' | 'stable';
}

interface ActivityFilter {
    dateRange: [Date | null, Date | null];
    clientId: number | null;
    actionType: string;
    sortBy: 'date' | 'client' | 'action';
    sortOrder: 'asc' | 'desc';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ClientAccessDashboard: React.FC = () => {
    const [accessStats, setAccessStats] = useState<ClientAccessStats>({
        totalClients: 0,
        activeClients: 0,
        totalProjects: 0,
        activeProjects: 0,
        totalUsers: 0,
        activeUsers: 0,
        recentActivities: []
    });
    const [clients, setClients] = useState<ClientWithStats[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
    const [clientDetailDialog, setClientDetailDialog] = useState(false);
    const [activityFilter, setActivityFilter] = useState<ActivityFilter>({
        dateRange: [null, null],
        clientId: null,
        actionType: 'all',
        sortBy: 'date',
        sortOrder: 'desc'
    });
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [clientsRes, projectsRes] = await Promise.all([
                getClients(),
                getProjects()
            ]);

            const clientsData = clientsRes.results || [];
            const projectsData = projectsRes.results || [];

            // Transform clients with mock statistics
            const clientsWithStats: ClientWithStats[] = clientsData.map((client: Client, index: number) => ({
                ...client,
                projectCount: Math.floor(Math.random() * 10) + 1,
                activeProjectCount: Math.floor(Math.random() * 5) + 1,
                userCount: parseInt(client.user_count) || 0,
                activeUserCount: Math.floor(Math.random() * 20) + 1,
                lastAccess: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
                totalAccesses: Math.floor(Math.random() * 1000) + 50,
                avgSessionDuration: Math.floor(Math.random() * 60) + 10,
                mostAccessedProject: projectsData[Math.floor(Math.random() * projectsData.length)]?.name,
                accessTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
            }));

            const stats: ClientAccessStats = {
                totalClients: clientsData.length,
                activeClients: clientsWithStats.filter(c => c.is_active).length,
                totalProjects: projectsData.length,
                activeProjects: Math.floor(projectsData.length * 0.8),
                totalUsers: clientsWithStats.reduce((sum, c) => sum + c.userCount, 0),
                activeUsers: clientsWithStats.reduce((sum, c) => sum + c.activeUserCount, 0),
                recentActivities: generateMockActivities(clientsData)
            };

            setClients(clientsWithStats);
            setAccessStats(stats);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateMockActivities = (clients: Client[]) => {
        const activities = [];
        const actionTypes = ['login', 'project_view', 'data_export', 'share_project', 'edit_feature'];
        
        for (let i = 0; i < 50; i++) {
            activities.push({
                id: i,
                client: clients[Math.floor(Math.random() * clients.length)]?.name || 'Unknown',
                clientId: clients[Math.floor(Math.random() * clients.length)]?.id || 0,
                action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
                project: `Project ${Math.floor(Math.random() * 10) + 1}`,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                duration: Math.floor(Math.random() * 120) + 5,
                success: Math.random() > 0.1
            });
        }
        
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const handleClientDetail = (client: ClientWithStats) => {
        setSelectedClient(client);
        setClientDetailDialog(true);
    };

    const handleQuickAction = async (clientId: number, action: 'activate' | 'deactivate' | 'reset') => {
        setLoading(true);
        try {
            switch (action) {
                case 'activate':
                case 'deactivate':
                    const updatedClients = clients.map(c => 
                        c.id === clientId ? { ...c, is_active: action === 'activate' } : c
                    );
                    setClients(updatedClients);
                    break;
                case 'reset':
                    // Reset client statistics
                    break;
            }
        } catch (err) {
            setError(`Failed to ${action} client`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && client.is_active) ||
            (statusFilter === 'inactive' && !client.is_active);
        return matchesSearch && matchesStatus;
    });

    const filteredActivities = accessStats.recentActivities.filter(activity => {
        const matchesClient = !activityFilter.clientId || activity.clientId === activityFilter.clientId;
        const matchesAction = activityFilter.actionType === 'all' || activity.action === activityFilter.actionType;
        const matchesDateRange = !activityFilter.dateRange[0] || !activityFilter.dateRange[1] ||
            (activity.timestamp >= activityFilter.dateRange[0] && activity.timestamp <= activityFilter.dateRange[1]);
        return matchesClient && matchesAction && matchesDateRange;
    });

    const accessTrendData = Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
        accesses: Math.floor(Math.random() * 100) + 20,
        users: Math.floor(Math.random() * 50) + 10
    }));

    const clientDistributionData = [
        { name: 'Active Clients', value: accessStats.activeClients, color: COLORS[0] },
        { name: 'Inactive Clients', value: accessStats.totalClients - accessStats.activeClients, color: COLORS[1] }
    ];

    const renderStatsCards = () => (
        <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom variant="h6">
                                    Total Clients
                                </Typography>
                                <Typography variant="h4">
                                    {accessStats.totalClients}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <People />
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
                                <Typography color="textSecondary" gutterBottom variant="h6">
                                    Active Projects
                                </Typography>
                                <Typography variant="h4">
                                    {accessStats.activeProjects}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                <Assignment />
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
                                <Typography color="textSecondary" gutterBottom variant="h6">
                                    Total Users
                                </Typography>
                                <Typography variant="h4">
                                    {accessStats.totalUsers}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
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
                                <Typography color="textSecondary" gutterBottom variant="h6">
                                    Active Users
                                </Typography>
                                <Typography variant="h4">
                                    {accessStats.activeUsers}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <TrendingUp />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderClientsTable = () => (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Client Overview</Typography>
                    <Box display="flex" gap={1}>
                        <TextField
                            size="small"
                            placeholder="Search clients..."
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
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Projects</TableCell>
                                <TableCell>Users</TableCell>
                                <TableCell>Last Access</TableCell>
                                <TableCell>Trend</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredClients.map(client => (
                                <TableRow key={client.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                {client.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {client.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {client.contact_email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={client.is_active ? 'Active' : 'Inactive'}
                                            color={client.is_active ? 'success' : 'default'}
                                            icon={client.is_active ? <CheckCircle /> : <Cancel />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2">
                                                {client.activeProjectCount}/{client.projectCount}
                                            </Typography>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={(client.activeProjectCount / client.projectCount) * 100}
                                                sx={{ width: 60, height: 4 }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            <Badge badgeContent={client.activeUserCount} color="primary">
                                                <Typography variant="body2">{client.userCount}</Typography>
                                            </Badge>
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {client.lastAccess ? (
                                            <Tooltip title={client.lastAccess.toLocaleString()}>
                                                <Typography variant="caption">
                                                    {client.lastAccess.toLocaleDateString()}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Never
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {client.accessTrend === 'up' && <TrendingUp color="success" />}
                                        {client.accessTrend === 'down' && <TrendingDown color="error" />}
                                        {client.accessTrend === 'stable' && <Analytics color="info" />}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5}>
                                            <Tooltip title="View Details">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleClientDetail(client)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={client.is_active ? 'Deactivate' : 'Activate'}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleQuickAction(
                                                        client.id, 
                                                        client.is_active ? 'deactivate' : 'activate'
                                                    )}
                                                >
                                                    {client.is_active ? <Block /> : <CheckCircle />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    const renderActivityTimeline = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                <Timeline>
                    {filteredActivities.slice(0, 10).map(activity => (
                        <TimelineItem key={activity.id}>
                            <TimelineOppositeContent sx={{ maxWidth: '120px' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {activity.timestamp.toLocaleTimeString()}
                                </Typography>
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                                <TimelineDot color={activity.success ? 'success' : 'error'}>
                                    {activity.action === 'login' && <Launch />}
                                    {activity.action === 'project_view' && <Visibility />}
                                    {activity.action === 'data_export' && <Download />}
                                    {activity.action === 'share_project' && <Launch />}
                                    {activity.action === 'edit_feature' && <Edit />}
                                </TimelineDot>
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                                <Typography variant="body2">{activity.client}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {activity.action.replace('_', ' ')} - {activity.project}
                                </Typography>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    );

    const renderCharts = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Access Trends (Last 7 Days)</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={accessTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="accesses" stroke="#8884d8" name="Total Accesses" />
                                <Line type="monotone" dataKey="users" stroke="#82ca9d" name="Unique Users" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Client Status Distribution</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={clientDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {clientDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">Client Access Dashboard</Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadDashboardData}
                        disabled={loading}
                    >
                        Refresh Data
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {renderStatsCards()}

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                        <Tab label="Overview" />
                        <Tab label="Activity" />
                        <Tab label="Analytics" />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            {renderClientsTable()}
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            {renderActivityTimeline()}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Filter Activities</Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <FormControl fullWidth>
                                            <InputLabel>Client</InputLabel>
                                            <Select
                                                value={activityFilter.clientId || ''}
                                                onChange={(e) => setActivityFilter(prev => ({
                                                    ...prev,
                                                    clientId: e.target.value as number || null
                                                }))}
                                            >
                                                <MenuItem value="">All Clients</MenuItem>
                                                {clients.map(client => (
                                                    <MenuItem key={client.id} value={client.id}>
                                                        {client.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth>
                                            <InputLabel>Action Type</InputLabel>
                                            <Select
                                                value={activityFilter.actionType}
                                                onChange={(e) => setActivityFilter(prev => ({
                                                    ...prev,
                                                    actionType: e.target.value
                                                }))}
                                            >
                                                <MenuItem value="all">All Actions</MenuItem>
                                                <MenuItem value="login">Login</MenuItem>
                                                <MenuItem value="project_view">Project View</MenuItem>
                                                <MenuItem value="data_export">Data Export</MenuItem>
                                                <MenuItem value="share_project">Share Project</MenuItem>
                                                <MenuItem value="edit_feature">Edit Feature</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 2 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            {renderCharts()}
                        </Grid>
                    </Grid>
                )}

                <Dialog 
                    open={clientDetailDialog} 
                    onClose={() => setClientDetailDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Client Details - {selectedClient?.name}</DialogTitle>
                    <DialogContent>
                        {selectedClient && (
                            <Grid container spacing={2} sx={{ pt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Typography><strong>Email:</strong> {selectedClient.contact_email}</Typography>
                                        <Typography><strong>Phone:</strong> {selectedClient.contact_phone}</Typography>
                                        <Typography><strong>Status:</strong> 
                                            <Chip 
                                                size="small" 
                                                label={selectedClient.is_active ? 'Active' : 'Inactive'}
                                                color={selectedClient.is_active ? 'success' : 'default'}
                                                sx={{ ml: 1 }}
                                            />
                                        </Typography>
                                        <Typography><strong>Created:</strong> {new Date(selectedClient.created_at).toLocaleDateString()}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Access Statistics</Typography>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Typography><strong>Total Accesses:</strong> {selectedClient.totalAccesses}</Typography>
                                        <Typography><strong>Projects:</strong> {selectedClient.activeProjectCount}/{selectedClient.projectCount}</Typography>
                                        <Typography><strong>Users:</strong> {selectedClient.activeUserCount}/{selectedClient.userCount}</Typography>
                                        <Typography><strong>Avg Session:</strong> {selectedClient.avgSessionDuration} min</Typography>
                                        <Typography><strong>Most Accessed:</strong> {selectedClient.mostAccessedProject}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setClientDetailDialog(false)}>Close</Button>
                        <Button variant="contained" startIcon={<Edit />}>
                            Edit Client
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default ClientAccessDashboard;