// src/pages/admin/fcc/FCCLocationsPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Search as SearchIcon,
    LocationOn as LocationOnIcon,
    Map as MapIcon,
    GetApp as GetAppIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import {
    FCCLocation,
    FCCLocationFilters,
    BoundingBoxQuery,
    getFCCLocations,
    queryFCCLocationsByBoundingBox,
    getFCCStatesSummary,
} from '../../../services/fccService';
import { PaginatedResponse } from '../../../types/common.types';

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
            id={`fcc-tabpanel-${index}`}
            aria-labelledby={`fcc-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const FCCLocationsPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    
    // Browse tab state
    const [locations, setLocations] = useState<FCCLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState<FCCLocationFilters>({});
    
    // Query tab state
    const [queryLoading, setQueryLoading] = useState(false);
    const [queryResults, setQueryResults] = useState<FCCLocation[]>([]);
    const [queryState, setQueryState] = useState('');
    const [boundingBox, setBoundingBox] = useState({
        west: '',
        south: '',
        east: '',
        north: ''
    });
    
    // Summary state
    const [summary, setSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    
    // Detail dialog state
    const [selectedLocation, setSelectedLocation] = useState<FCCLocation | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Load locations for browse tab
    const loadLocations = async () => {
        setLoading(true);
        try {
            const response = await getFCCLocations({
                ...filters,
                page: page + 1,
                page_size: rowsPerPage,
            });
            setLocations(response.results);
            setTotalCount(response.count);
        } catch (error) {
            console.error('Error loading FCC locations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load summary data
    const loadSummary = async () => {
        setSummaryLoading(true);
        try {
            const summaryData = await getFCCStatesSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading FCC summary:', error);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        if (tabValue === 0) {
            loadLocations();
        } else if (tabValue === 2 && !summary) {
            loadSummary();
        }
    }, [tabValue, page, rowsPerPage, filters]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSearch = () => {
        setPage(0);
        loadLocations();
    };

    const handleBoundingBoxQuery = async () => {
        if (!boundingBox.west || !boundingBox.south || !boundingBox.east || !boundingBox.north) {
            alert('Please fill in all bounding box coordinates');
            return;
        }

        setQueryLoading(true);
        try {
            const query: BoundingBoxQuery = {
                bbox: [
                    parseFloat(boundingBox.west),
                    parseFloat(boundingBox.south),
                    parseFloat(boundingBox.east),
                    parseFloat(boundingBox.north)
                ]
            };
            
            if (queryState) {
                query.state = queryState;
            }

            const response = await queryFCCLocationsByBoundingBox(query);
            setQueryResults(response.results);
        } catch (error) {
            console.error('Error querying FCC locations:', error);
        } finally {
            setQueryLoading(false);
        }
    };

    const handleLocationClick = (location: FCCLocation) => {
        setSelectedLocation(location);
        setDetailDialogOpen(true);
    };

    const formatCoordinate = (coord: number) => {
        return coord.toFixed(6);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                FCC BDC Locations Management
            </Typography>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Browse Locations" />
                <Tab label="Bounding Box Query" />
                <Tab label="Summary & Analytics" />
            </Tabs>

            {/* Browse Tab */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* Filters */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Search & Filters
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Search"
                                            value={filters.search || ''}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                            placeholder="Location ID, state, county..."
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            fullWidth
                                            label="State"
                                            value={filters.state || ''}
                                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="County"
                                            value={filters.county_name || ''}
                                            onChange={(e) => setFilters({ ...filters, county_name: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <FormControl fullWidth>
                                            <InputLabel>Order By</InputLabel>
                                            <Select
                                                value={filters.ordering || ''}
                                                onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
                                            >
                                                <MenuItem value="">Default</MenuItem>
                                                <MenuItem value="fcc_location_id">FCC ID (ASC)</MenuItem>
                                                <MenuItem value="-fcc_location_id">FCC ID (DESC)</MenuItem>
                                                <MenuItem value="state_name">State (ASC)</MenuItem>
                                                <MenuItem value="-state_name">State (DESC)</MenuItem>
                                                <MenuItem value="county_name">County (ASC)</MenuItem>
                                                <MenuItem value="-county_name">County (DESC)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <LoadingButton
                                            fullWidth
                                            variant="contained"
                                            startIcon={<SearchIcon />}
                                            onClick={handleSearch}
                                            loading={loading}
                                        >
                                            Search
                                        </LoadingButton>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Results */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        FCC Locations ({totalCount.toLocaleString()})
                                    </Typography>
                                    <Box>
                                        <IconButton onClick={loadLocations}>
                                            <RefreshIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>FCC Location ID</TableCell>
                                                <TableCell>Coordinates</TableCell>
                                                <TableCell>State</TableCell>
                                                <TableCell>County</TableCell>
                                                <TableCell>GEOID</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">
                                                        <CircularProgress />
                                                    </TableCell>
                                                </TableRow>
                                            ) : locations.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">
                                                        No locations found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                locations.map((location) => (
                                                    <TableRow key={location.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {location.fcc_location_id}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatCoordinate(location.lat)}, {formatCoordinate(location.long)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={location.state_name}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {location.county_name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                State: {location.state_geoid || 'N/A'}<br />
                                                                County: {location.county_geoid}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleLocationClick(location)}
                                                                title="View Details"
                                                            >
                                                                <InfoIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                href={`https://www.google.com/maps/@${location.lat},${location.long},15z`}
                                                                target="_blank"
                                                                title="View on Map"
                                                            >
                                                                <MapIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                
                                <TablePagination
                                    component="div"
                                    count={totalCount}
                                    page={page}
                                    onPageChange={(event, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(event) => {
                                        setRowsPerPage(parseInt(event.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Query Tab */}
            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Bounding Box Query
                                </Typography>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Query FCC locations within a specific geographic bounding box. 
                                    Coordinates should be in decimal degrees (WGS84).
                                </Alert>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="State (Optional)"
                                            value={queryState}
                                            onChange={(e) => setQueryState(e.target.value)}
                                            placeholder="e.g., VA, CA, TX"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="West (Longitude)"
                                            type="number"
                                            value={boundingBox.west}
                                            onChange={(e) => setBoundingBox({ ...boundingBox, west: e.target.value })}
                                            placeholder="-79.5"
                                            inputProps={{ step: 'any' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="East (Longitude)"
                                            type="number"
                                            value={boundingBox.east}
                                            onChange={(e) => setBoundingBox({ ...boundingBox, east: e.target.value })}
                                            placeholder="-78.7"
                                            inputProps={{ step: 'any' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="South (Latitude)"
                                            type="number"
                                            value={boundingBox.south}
                                            onChange={(e) => setBoundingBox({ ...boundingBox, south: e.target.value })}
                                            placeholder="37.9"
                                            inputProps={{ step: 'any' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="North (Latitude)"
                                            type="number"
                                            value={boundingBox.north}
                                            onChange={(e) => setBoundingBox({ ...boundingBox, north: e.target.value })}
                                            placeholder="38.3"
                                            inputProps={{ step: 'any' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <LoadingButton
                                            fullWidth
                                            variant="contained"
                                            startIcon={<SearchIcon />}
                                            onClick={handleBoundingBoxQuery}
                                            loading={queryLoading}
                                        >
                                            Execute Query
                                        </LoadingButton>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {queryResults.length > 0 && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Query Results ({queryResults.length} locations)
                                    </Typography>
                                    
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>FCC Location ID</TableCell>
                                                    <TableCell>Coordinates</TableCell>
                                                    <TableCell>State</TableCell>
                                                    <TableCell>County</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {queryResults.map((location) => (
                                                    <TableRow key={location.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {location.fcc_location_id}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatCoordinate(location.lat)}, {formatCoordinate(location.long)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={location.state_name}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {location.county_name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleLocationClick(location)}
                                                                title="View Details"
                                                            >
                                                                <InfoIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                href={`https://www.google.com/maps/@${location.lat},${location.long},15z`}
                                                                target="_blank"
                                                                title="View on Map"
                                                            >
                                                                <MapIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* Summary Tab */}
            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    {summaryLoading ? (
                        <Grid item xs={12} textAlign="center">
                            <CircularProgress />
                        </Grid>
                    ) : summary ? (
                        <>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            System Overview
                                        </Typography>
                                        <Typography variant="h3" color="primary">
                                            {summary.total_locations?.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Total FCC Locations
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            States Summary ({summary.states?.length} states)
                                        </Typography>
                                        
                                        <TableContainer component={Paper}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>State</TableCell>
                                                        <TableCell align="right">Locations</TableCell>
                                                        <TableCell align="right">Counties</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {summary.states?.map((state: any) => (
                                                        <TableRow key={state.state_name} hover>
                                                            <TableCell>
                                                                <Chip
                                                                    label={state.state_name}
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {state.location_count.toLocaleString()}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="body2">
                                                                    {state.counties.length}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Alert severity="error">
                                Failed to load summary data. Please try again.
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* Location Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon />
                        FCC Location Details
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedLocation && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    FCC Location ID
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedLocation.fcc_location_id}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Coordinates
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formatCoordinate(selectedLocation.lat)}, {formatCoordinate(selectedLocation.long)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    State
                                </Typography>
                                <Chip
                                    label={selectedLocation.state_name}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    County
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedLocation.county_name || 'Not specified'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    State GEOID
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedLocation.state_geoid || 'Not specified'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    County GEOID
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {selectedLocation.county_geoid}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedLocation && (
                        <Button
                            startIcon={<MapIcon />}
                            href={`https://www.google.com/maps/@${selectedLocation.lat},${selectedLocation.long},15z`}
                            target="_blank"
                        >
                            View on Map
                        </Button>
                    )}
                    <Button onClick={() => setDetailDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FCCLocationsPage;