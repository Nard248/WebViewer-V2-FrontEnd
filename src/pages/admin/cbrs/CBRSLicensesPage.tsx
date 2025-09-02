// src/pages/admin/cbrs/CBRSLicensesPage.tsx
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
    DialogActions,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Radio as RadioIcon,
    Analytics as AnalyticsIcon,
    Place as PlaceIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
    getCBRSLicenses, 
    deleteCBRSLicense,
    bulkCreateCBRSLicenses,
    CBRSLicense,
    CBRSLicenseCreate
} from '../../../services/cbrsService';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CBRSLicensesPage: React.FC = () => {
    const navigate = useNavigate();
    
    const [licenses, setLicenses] = useState<CBRSLicense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    
    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [licenseToDelete, setLicenseToDelete] = useState<CBRSLicense | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importData, setImportData] = useState('');

    useEffect(() => {
        loadLicenses();
    }, [page, rowsPerPage, search, stateFilter]);

    const loadLicenses = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getCBRSLicenses({
                page: page + 1,
                page_size: rowsPerPage,
                search: search || undefined,
                state_abbr: stateFilter || undefined,
                ordering: '-created_at'
            });
            setLicenses(response.results);
            setTotalCount(response.count);
        } catch (err) {
            setError('Failed to load CBRS licenses. Please try again.');
            console.error('Error loading CBRS licenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(0);
    };

    const handleStateFilter = (event: any) => {
        setStateFilter(event.target.value);
        setPage(0);
    };

    const handleDeleteClick = (license: CBRSLicense) => {
        setLicenseToDelete(license);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!licenseToDelete) return;
        
        try {
            await deleteCBRSLicense(licenseToDelete.id);
            setLicenses(prev => prev.filter(l => l.id !== licenseToDelete.id));
            setTotalCount(prev => prev - 1);
            setSuccess('CBRS license deleted successfully.');
        } catch (err) {
            setError('Failed to delete CBRS license. Please try again.');
            console.error('Error deleting CBRS license:', err);
        } finally {
            setDeleteDialogOpen(false);
            setLicenseToDelete(null);
        }
    };

    const handleEditClick = (id: number) => {
        navigate(`/admin/cbrs/${id}/edit`);
    };

    const handleCreateClick = () => {
        navigate('/admin/cbrs/create');
    };

    const handleBulkImport = async () => {
        if (!importData.trim()) return;

        try {
            const lines = importData.trim().split('\n');
            const licenses: CBRSLicenseCreate[] = [];

            for (let i = 1; i < lines.length; i++) { // Skip header
                const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
                if (columns.length >= 5) {
                    licenses.push({
                        county_fips: columns[0],
                        county_name: columns[1],
                        state_abbr: columns[2],
                        channel: columns[3],
                        bidder: columns[4],
                        license_date: columns[5] || undefined,
                        frequency_mhz: columns[6] ? parseFloat(columns[6]) : undefined,
                    });
                }
            }

            const result = await bulkCreateCBRSLicenses(licenses);
            setSuccess(`Successfully imported ${result.created.length} licenses. ${result.errors.length} errors.`);
            setImportDialogOpen(false);
            setImportData('');
            loadLicenses();
        } catch (err) {
            setError('Failed to import CBRS licenses. Please check the format.');
            console.error('Error importing CBRS licenses:', err);
        }
    };

    const handleExportData = () => {
        const csvContent = [
            'County FIPS,County Name,State,Channel,Bidder,License Date,Frequency (MHz)',
            ...licenses.map(license => 
                `${license.county_fips},${license.county_name},${license.state_abbr},${license.channel},${license.bidder},${license.license_date || ''},${license.frequency_mhz || ''}`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `cbrs_licenses_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const getUniqueStates = () => {
        return [...new Set(licenses.map(l => l.state_abbr))].sort();
    };

    const getUniqueBidders = () => {
        return [...new Set(licenses.map(l => l.bidder))].sort();
    };

    const getLicenseStats = () => {
        const states = getUniqueStates().length;
        const bidders = getUniqueBidders().length;
        const counties = new Set(licenses.map(l => l.county_fips)).size;
        const channels = new Set(licenses.map(l => l.channel)).size;
        
        return { states, bidders, counties, channels };
    };

    const stats = getLicenseStats();

    if (loading && licenses.length === 0) {
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
                        CBRS Licenses
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Citizens Broadband Radio Service spectrum licenses
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        startIcon={<UploadIcon />}
                        onClick={() => setImportDialogOpen(true)}
                        variant="outlined"
                    >
                        Import
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleExportData}
                        variant="outlined"
                        disabled={licenses.length === 0}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                    >
                        Add License
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <RadioIcon color="primary" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{totalCount}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Licenses
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
                                <PlaceIcon color="success" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{stats.states}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        States Covered
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
                                <BusinessIcon color="info" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{stats.bidders}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        License Holders
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
                                <AnalyticsIcon color="warning" sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="h6">{stats.channels}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Channels Used
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by county, bidder, or channel..."
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
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Filter by State</InputLabel>
                        <Select
                            value={stateFilter}
                            onChange={handleStateFilter}
                        >
                            <MenuItem value="">All States</MenuItem>
                            {US_STATES.map((state) => (
                                <MenuItem key={state} value={state}>
                                    {state}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
                            <TableCell>County</TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>Channel</TableCell>
                            <TableCell>License Holder</TableCell>
                            <TableCell>Frequency</TableCell>
                            <TableCell>License Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {licenses.map((license) => (
                            <TableRow key={license.id} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            {license.county_name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            FIPS: {license.county_fips}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={license.state_abbr}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {license.channel}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {license.bidder}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {license.frequency_mhz ? (
                                        <Typography variant="body2">
                                            {license.frequency_mhz} MHz
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">
                                            —
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {license.license_date 
                                            ? new Date(license.license_date).toLocaleDateString()
                                            : '—'
                                        }
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Edit License">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(license.id)}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete License">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(license)}
                                            color="error"
                                        >
                                            <DeleteIcon />
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete CBRS License</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the CBRS license for "{licenseToDelete?.county_name}, {licenseToDelete?.state_abbr}" 
                        on channel "{licenseToDelete?.channel}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Import CBRS Licenses</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Paste CSV data with the following format (first line should be header):
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ mb: 2, p: 1, bgcolor: 'grey.50' }}>
                        County FIPS,County Name,State,Channel,Bidder,License Date,Frequency (MHz)
                    </Typography>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={15}
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="Paste CSV data here..."
                        InputProps={{
                            sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleBulkImport}
                        variant="contained"
                        disabled={!importData.trim()}
                    >
                        Import Licenses
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CBRSLicensesPage;