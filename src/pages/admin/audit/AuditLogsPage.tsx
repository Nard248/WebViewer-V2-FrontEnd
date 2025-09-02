// src/pages/admin/audit/AuditLogsPage.tsx
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
    TextField,
    InputAdornment,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    Timeline as TimelineIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Assessment as ActivityIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import {
    getAuditLogs,
    getSystemActivitySummary,
    exportAuditLogs,
    AuditLog,
    AuditLogFilters
} from '../../../services/auditService';

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'CREATE': 'success',
    'UPDATE': 'info',
    'DELETE': 'error',
    'VIEW': 'default',
    'LOGIN': 'primary',
    'LOGOUT': 'secondary',
    'EXPORT': 'warning',
    'IMPORT': 'info',
};

const RESOURCE_TYPES = [
    'Project',
    'Layer',
    'LayerGroup',
    'Client',
    'User',
    'Basemap',
    'MapTool',
    'LayerFunction',
    'ColorPalette',
    'PopupTemplate',
    'Style',
    'Marker',
    'CBRSLicense',
];

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    
    // Filters
    const [filters, setFilters] = useState<AuditLogFilters>({
        ordering: '-occurred_at'
    });
    
    // Dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    
    // Summary data
    const [summary, setSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    useEffect(() => {
        loadLogs();
        loadSummary();
    }, [page, rowsPerPage, filters]);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getAuditLogs({
                ...filters,
                page: page + 1,
                page_size: rowsPerPage,
            });
            setLogs(response.results);
            setTotalCount(response.count);
        } catch (err) {
            setError('Failed to load audit logs. Please try again.');
            console.error('Error loading audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        setSummaryLoading(true);
        try {
            const summaryData = await getSystemActivitySummary();
            setSummary(summaryData);
        } catch (err) {
            console.error('Error loading system activity summary:', err);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailDialogOpen(true);
    };

    const handleExport = async () => {
        try {
            const blob = await exportAuditLogs(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccess('Audit logs exported successfully.');
        } catch (err) {
            setError('Failed to export audit logs.');
            console.error('Error exporting audit logs:', err);
        }
    };

    const getActionChip = (action: string) => {
        const color = ACTION_COLORS[action] || 'default';
        return (
            <Chip
                label={action}
                size="small"
                color={color}
                variant="filled"
            />
        );
    };

    const formatActionDetails = (details: Record<string, any>) => {
        if (!details || typeof details !== 'object') return 'N/A';
        
        const entries = Object.entries(details);
        if (entries.length === 0) return 'N/A';
        
        return entries.slice(0, 3).map(([key, value]) => 
            `${key}: ${typeof value === 'object' ? 'Object' : String(value).slice(0, 50)}`
        ).join(', ');
    };

    if (loading && logs.length === 0) {
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
                        Audit Logs
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        System activity and user action tracking
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={loadLogs}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        variant="outlined"
                        disabled={logs.length === 0}
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            {summary && !summaryLoading && (
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <SecurityIcon color="primary" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{summary.total_logs.toLocaleString()}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Total Events
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
                                    <PersonIcon color="success" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">{summary.unique_users}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Active Users
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
                                    <ActivityIcon color="info" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">
                                            {summary.action_breakdown[0]?.action || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Most Common Action
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
                                    <TimelineIcon color="warning" sx={{ mr: 1 }} />
                                    <Box>
                                        <Typography variant="h6">
                                            {summary.activity_by_day.slice(-1)[0]?.count || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Today's Events
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                        <FilterIcon sx={{ mr: 1 }} />
                        <Typography>Advanced Filters</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search by user, action, or details..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Action</InputLabel>
                                <Select
                                    value={filters.action || ''}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                >
                                    <MenuItem value="">All Actions</MenuItem>
                                    {Object.keys(ACTION_COLORS).map((action) => (
                                        <MenuItem key={action} value={action}>
                                            {action}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Resource Type</InputLabel>
                                <Select
                                    value={filters.resource_type || ''}
                                    onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                                >
                                    <MenuItem value="">All Resources</MenuItem>
                                    {RESOURCE_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="From Date"
                                value={filters.date_from ? new Date(filters.date_from) : null}
                                onChange={(date) => handleFilterChange('date_from', date?.toISOString().split('T')[0])}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="To Date"
                                value={filters.date_to ? new Date(filters.date_to) : null}
                                onChange={(date) => handleFilterChange('date_to', date?.toISOString().split('T')[0])}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

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
                            <TableCell>Timestamp</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Resource</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} hover>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(log.occurred_at).toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box>
                                        <Typography variant="subtitle2">
                                            {log.user_full_name || log.user_username || `User ${log.user}`}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            ID: {log.user}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {getActionChip(log.action)}
                                </TableCell>
                                <TableCell>
                                    {log.resource_type && (
                                        <Box>
                                            <Typography variant="body2">
                                                {log.resource_type}
                                            </Typography>
                                            {log.resource_name && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {log.resource_name}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {log.ip_address}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                        {formatActionDetails(log.action_details)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewDetails(log)}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </Tooltip>
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
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </TableContainer>

            {/* Detail Dialog */}
            <Dialog 
                open={detailDialogOpen} 
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogContent>
                    {selectedLog && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Timestamp
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(selectedLog.occurred_at).toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    User
                                </Typography>
                                <Typography variant="body1">
                                    {selectedLog.user_full_name || selectedLog.user_username || `User ${selectedLog.user}`}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Action
                                </Typography>
                                <Box mt={1}>
                                    {getActionChip(selectedLog.action)}
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    IP Address
                                </Typography>
                                <Typography variant="body1" fontFamily="monospace">
                                    {selectedLog.ip_address}
                                </Typography>
                            </Grid>
                            {selectedLog.resource_type && (
                                <>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Resource Type
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedLog.resource_type}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Resource ID
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedLog.resource_id || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Action Details
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        backgroundColor: 'grey.50',
                                        p: 2,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        fontSize: '0.875rem',
                                        fontFamily: 'monospace',
                                        mt: 1,
                                    }}
                                >
                                    {JSON.stringify(selectedLog.action_details, null, 2)}
                                </Box>
                            </Grid>
                            {selectedLog.user_agent && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        User Agent
                                    </Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {selectedLog.user_agent}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AuditLogsPage;