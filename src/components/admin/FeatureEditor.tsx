// src/components/admin/FeatureEditor.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Map as MapIcon,
    Code as CodeIcon,
} from '@mui/icons-material';
import { getFeature, updateFeature, createFeature, deleteFeature } from '../../services/layerService';

interface Feature {
    id?: number;
    project_layer: number;
    geometry: {
        type: string;
        coordinates: number[] | number[][] | number[][][];
    };
    properties: Record<string, any>;
    feature_id?: string;
}

interface FeatureEditorProps {
    open: boolean;
    onClose: () => void;
    feature?: Feature | null;
    layerId: number;
    onSave?: (feature: Feature) => void;
    onDelete?: (featureId: number) => void;
    mode?: 'create' | 'edit';
}

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
            id={`feature-tabpanel-${index}`}
            aria-labelledby={`feature-tab-${index}`}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
};

const FeatureEditor: React.FC<FeatureEditorProps> = ({
    open,
    onClose,
    feature,
    layerId,
    onSave,
    onDelete,
    mode = 'edit',
}) => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<Feature>({
        project_layer: layerId,
        geometry: {
            type: 'Point',
            coordinates: [0, 0],
        },
        properties: {},
    });
    
    const [propertyKey, setPropertyKey] = useState('');
    const [propertyValue, setPropertyValue] = useState('');

    useEffect(() => {
        if (feature) {
            setFormData(feature);
        } else {
            setFormData({
                project_layer: layerId,
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {},
            });
        }
    }, [feature, layerId]);

    const geometryTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];

    const handleGeometryTypeChange = (type: string) => {
        let coordinates: number[] | number[][] | number[][][] = [0, 0];
        
        switch (type) {
            case 'Point':
                coordinates = [0, 0];
                break;
            case 'LineString':
                coordinates = [[0, 0], [1, 1]];
                break;
            case 'Polygon':
                coordinates = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
                break;
            case 'MultiPoint':
                coordinates = [[0, 0], [1, 1]];
                break;
            case 'MultiLineString':
                coordinates = [[[0, 0], [1, 1]], [[2, 2], [3, 3]]];
                break;
            case 'MultiPolygon':
                coordinates = [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]];
                break;
        }

        setFormData(prev => ({
            ...prev,
            geometry: {
                type,
                coordinates,
            },
        }));
    };

    const handleCoordinatesChange = (coordString: string) => {
        try {
            const coordinates = JSON.parse(coordString);
            setFormData(prev => ({
                ...prev,
                geometry: {
                    ...prev.geometry,
                    coordinates,
                },
            }));
        } catch (err) {
            // Invalid JSON, ignore
        }
    };

    const handleAddProperty = () => {
        if (propertyKey.trim()) {
            let value: any = propertyValue;
            
            // Try to parse as number or boolean
            if (propertyValue === 'true') value = true;
            else if (propertyValue === 'false') value = false;
            else if (!isNaN(Number(propertyValue)) && propertyValue.trim() !== '') {
                value = Number(propertyValue);
            }

            setFormData(prev => ({
                ...prev,
                properties: {
                    ...prev.properties,
                    [propertyKey]: value,
                },
            }));

            setPropertyKey('');
            setPropertyValue('');
        }
    };

    const handleRemoveProperty = (key: string) => {
        setFormData(prev => ({
            ...prev,
            properties: Object.fromEntries(
                Object.entries(prev.properties).filter(([k]) => k !== key)
            ),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            let savedFeature: Feature;
            
            if (mode === 'create') {
                savedFeature = await createFeature(formData);
            } else if (formData.id) {
                savedFeature = await updateFeature(formData.id, formData);
            } else {
                throw new Error('Feature ID required for update');
            }

            onSave?.(savedFeature);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save feature. Please try again.');
            console.error('Error saving feature:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;

        setSaving(true);
        setError(null);

        try {
            await deleteFeature(formData.id);
            onDelete?.(formData.id);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete feature. Please try again.');
            console.error('Error deleting feature:', err);
        } finally {
            setSaving(false);
        }
    };

    const formatPropertyValue = (value: any): string => {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <MapIcon />
                    {mode === 'create' ? 'Create Feature' : 'Edit Feature'}
                    {formData.feature_id && (
                        <Chip label={`ID: ${formData.feature_id}`} size="small" variant="outlined" />
                    )}
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Geometry" />
                    <Tab label="Properties" />
                    <Tab label="JSON View" />
                </Tabs>

                {/* Geometry Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Geometry Type"
                                value={formData.geometry.type}
                                onChange={(e) => handleGeometryTypeChange(e.target.value)}
                                fullWidth
                                SelectProps={{ native: true }}
                            >
                                {geometryTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Coordinates (JSON)"
                                value={JSON.stringify(formData.geometry.coordinates, null, 2)}
                                onChange={(e) => handleCoordinatesChange(e.target.value)}
                                fullWidth
                                multiline
                                rows={6}
                                helperText="Enter coordinates as JSON array. Format varies by geometry type."
                                error={(() => {
                                    try {
                                        JSON.parse(JSON.stringify(formData.geometry.coordinates));
                                        return false;
                                    } catch {
                                        return true;
                                    }
                                })()}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Properties Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            Add Property
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={4}>
                                <TextField
                                    label="Key"
                                    value={propertyKey}
                                    onChange={(e) => setPropertyKey(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Value"
                                    value={propertyValue}
                                    onChange={(e) => setPropertyValue(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddProperty}
                                    variant="outlined"
                                    disabled={!propertyKey.trim()}
                                >
                                    Add
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                        Current Properties ({Object.keys(formData.properties).length})
                    </Typography>

                    {Object.keys(formData.properties).length === 0 ? (
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="textSecondary">
                                No properties added yet. Add properties to store metadata about this feature.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box>
                            {Object.entries(formData.properties).map(([key, value]) => (
                                <Accordion key={key}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box display="flex" alignItems="center" gap={1} width="100%">
                                            <Typography variant="body2" fontWeight="medium">
                                                {key}
                                            </Typography>
                                            <Chip 
                                                label={typeof value} 
                                                size="small" 
                                                variant="outlined" 
                                            />
                                            <Box flexGrow={1} />
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveProperty(key);
                                                }}
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField
                                            fullWidth
                                            multiline
                                            value={formatPropertyValue(value)}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    properties: {
                                                        ...prev.properties,
                                                        [key]: e.target.value,
                                                    },
                                                }));
                                            }}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </TabPanel>

                {/* JSON View Tab */}
                <TabPanel value={tabValue} index={2}>
                    <TextField
                        label="Feature GeoJSON"
                        value={JSON.stringify(formData, null, 2)}
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                setFormData(parsed);
                            } catch {
                                // Invalid JSON, ignore
                            }
                        }}
                        fullWidth
                        multiline
                        rows={15}
                        helperText="Direct JSON editing - be careful with syntax"
                        InputProps={{
                            sx: { fontFamily: 'monospace' },
                        }}
                    />
                </TabPanel>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                
                {mode === 'edit' && formData.id && (
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={saving}
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>
                )}
                
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                    {mode === 'create' ? 'Create Feature' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FeatureEditor;