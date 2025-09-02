// src/pages/admin/map-tools/MapToolCreatePage.tsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Divider,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as BackIcon,
    PlayArrow as TestIcon,
    Code as CodeIcon,
    Settings as SettingsIcon,
    Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MapToolCreate, createMapTool } from '../../../services/mapService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tool-tabpanel-${index}`}
            aria-labelledby={`tool-tab-${index}`}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
};

const TOOL_TYPES = [
    { value: 'measure_distance', label: 'Measure Distance', icon: 'straighten' },
    { value: 'measure_area', label: 'Measure Area', icon: 'crop_free' },
    { value: 'draw_point', label: 'Draw Point', icon: 'place' },
    { value: 'draw_line', label: 'Draw Line', icon: 'timeline' },
    { value: 'draw_polygon', label: 'Draw Polygon', icon: 'pentagon' },
    { value: 'export_data', label: 'Export Data', icon: 'download' },
    { value: 'search', label: 'Search', icon: 'search' },
    { value: 'filter', label: 'Filter', icon: 'filter_list' },
    { value: 'custom', label: 'Custom', icon: 'extension' },
];

const UI_POSITIONS = [
    { value: 'topright', label: 'Top Right' },
    { value: 'topleft', label: 'Top Left' },
    { value: 'bottomright', label: 'Bottom Right' },
    { value: 'bottomleft', label: 'Bottom Left' },
    { value: 'top', label: 'Top Center' },
    { value: 'bottom', label: 'Bottom Center' },
];

const MATERIAL_ICONS = [
    'build', 'settings', 'search', 'filter_list', 'place', 'timeline', 'pentagon',
    'crop_free', 'straighten', 'download', 'upload', 'save', 'edit', 'delete',
    'visibility', 'zoom_in', 'zoom_out', 'fullscreen', 'layers', 'map',
    'navigation', 'my_location', 'gps_fixed', 'location_on', 'room',
];

const DEFAULT_TOOL_CODE = `// Custom map tool implementation
// This function will be called when the tool is activated
function initTool(map, options) {
    console.log('Tool initialized with options:', options);
    
    // Your tool implementation here
    // Example: Add click handler to map
    map.on('click', function(e) {
        console.log('Map clicked at:', e.latlng);
    });
    
    // Return cleanup function (optional)
    return function cleanup() {
        console.log('Tool deactivated');
        // Remove event listeners, clean up resources
    };
}

// Export the main function
return initTool;`;

const MapToolCreatePage: React.FC = () => {
    const navigate = useNavigate();
    
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<MapToolCreate>({
        name: '',
        description: '',
        tool_type: 'custom',
        icon: 'build',
        default_options: {},
        ui_position: 'topright',
        tool_code: DEFAULT_TOOL_CODE,
        is_system: false,
    });

    const handleInputChange = (field: keyof MapToolCreate) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const value = event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionsChange = (options: Record<string, unknown>) => {
        setFormData(prev => ({ ...prev, default_options: options }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createMapTool(formData);
            navigate('/admin/map-tools');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create map tool. Please try again.');
            console.error('Error creating map tool:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/map-tools');
    };

    const handleTestCode = () => {
        try {
            // Basic syntax check
            new Function(formData.tool_code || '');
            alert('Code syntax is valid!');
        } catch (err) {
            alert(`Code syntax error: ${err}`);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                >
                    Back to Map Tools
                </Button>
                <Typography variant="h4" component="h1">
                    Create Map Tool
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab icon={<SettingsIcon />} label="Basic Settings" />
                    <Tab icon={<CodeIcon />} label="Tool Code" />
                    <Tab icon={<PreviewIcon />} label="Preview" />
                </Tabs>
            </Paper>

            <form onSubmit={handleSubmit}>
                {/* Basic Settings Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Paper sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Tool Name"
                                    value={formData.name}
                                    onChange={handleInputChange('name')}
                                    fullWidth
                                    required
                                    helperText="A descriptive name for this tool"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Tool Type</InputLabel>
                                    <Select
                                        value={formData.tool_type}
                                        onChange={handleInputChange('tool_type')}
                                    >
                                        {TOOL_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box
                                                        component="span"
                                                        sx={{ fontFamily: 'Material Icons', fontSize: 18 }}
                                                    >
                                                        {type.icon}
                                                    </Box>
                                                    {type.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={formData.description}
                                    onChange={handleInputChange('description')}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    helperText="Describe what this tool does and how to use it"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Icon</InputLabel>
                                    <Select
                                        value={formData.icon}
                                        onChange={handleInputChange('icon')}
                                    >
                                        {MATERIAL_ICONS.map((icon) => (
                                            <MenuItem key={icon} value={icon}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box
                                                        component="span"
                                                        sx={{ fontFamily: 'Material Icons', fontSize: 18 }}
                                                    >
                                                        {icon}
                                                    </Box>
                                                    {icon}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>UI Position</InputLabel>
                                    <Select
                                        value={formData.ui_position}
                                        onChange={handleInputChange('ui_position')}
                                    >
                                        {UI_POSITIONS.map((position) => (
                                            <MenuItem key={position.value} value={position.value}>
                                                {position.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Default Options (JSON)
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={JSON.stringify(formData.default_options, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const options = JSON.parse(e.target.value);
                                            handleOptionsChange(options);
                                        } catch {
                                            // Invalid JSON, ignore
                                        }
                                    }}
                                    helperText="Default configuration options for this tool (JSON format)"
                                    InputProps={{
                                        sx: { fontFamily: 'monospace' },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </TabPanel>

                {/* Tool Code Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Paper sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                Tool Implementation Code
                            </Typography>
                            <Button
                                startIcon={<TestIcon />}
                                onClick={handleTestCode}
                                variant="outlined"
                                size="small"
                            >
                                Test Syntax
                            </Button>
                        </Box>
                        
                        <TextField
                            fullWidth
                            multiline
                            rows={20}
                            value={formData.tool_code}
                            onChange={handleInputChange('tool_code')}
                            helperText="JavaScript code that implements the tool functionality"
                            InputProps={{
                                sx: { 
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                The code should define an <code>initTool</code> function that receives a map instance and options.
                                Return a cleanup function if the tool needs to remove event listeners when deactivated.
                            </Typography>
                        </Alert>
                    </Paper>
                </TabPanel>

                {/* Preview Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Tool Preview
                                    </Typography>
                                    
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Box
                                            component="span"
                                            sx={{
                                                fontFamily: 'Material Icons',
                                                fontSize: 24,
                                                color: 'primary.main',
                                            }}
                                        >
                                            {formData.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {formData.name || 'Tool Name'}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {formData.description || 'Tool description'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" gap={1} mb={2}>
                                        <Chip label={TOOL_TYPES.find(t => t.value === formData.tool_type)?.label} size="small" />
                                        <Chip label={UI_POSITIONS.find(p => p.value === formData.ui_position)?.label} size="small" />
                                    </Box>

                                    <Typography variant="caption" color="textSecondary">
                                        This is how the tool will appear in the map interface
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Configuration
                                    </Typography>
                                    
                                    <Box mb={2}>
                                        <Typography variant="body2" color="textSecondary">
                                            Default Options:
                                        </Typography>
                                        <Box
                                            component="pre"
                                            sx={{
                                                fontSize: '0.75rem',
                                                fontFamily: 'monospace',
                                                backgroundColor: 'grey.50',
                                                p: 1,
                                                borderRadius: 1,
                                                overflow: 'auto',
                                                maxHeight: 200,
                                            }}
                                        >
                                            {JSON.stringify(formData.default_options, null, 2)}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Actions */}
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                    <Button
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={loading || !formData.name}
                    >
                        Create Map Tool
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default MapToolCreatePage;