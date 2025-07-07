// src/components/viewer/StandaloneLayerControl.tsx - With Zoom Level Feedback
import React, { useState, useRef, useEffect } from 'react';
import { Box, FormControlLabel, Checkbox, Radio, RadioGroup, Typography, IconButton, Collapse, Tooltip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LayersIcon from '@mui/icons-material/Layers';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GetAppIcon from '@mui/icons-material/GetApp';
import { TowerWithBuffers, BufferVisibilityState, VirtualBufferLayer } from './FrontendAntennaBufferSystem';
import { ZoomHint, zoomVisibilityManager } from './ZoomVisibilityManager';
import { SelectedTowersVirtualLayer, selectedTowersManager } from './SelectedTowersManager';
import { exportCSV } from '../../utils';

interface StandaloneLayerControlProps {
    projectData: any;
    visibleLayers: Set<number>;
    activeBasemap: number | null;
    onLayerToggle: (layerId: number) => void;
    onBasemapChange: (basemapId: number) => void;
    // Frontend buffer system props
    towerBufferRelationships?: TowerWithBuffers[];
    onBufferToggle?: (bufferId: string, isVisible: boolean) => void;
    bufferVisibility?: BufferVisibilityState;
    // Zoom system props
    zoomHints?: ZoomHint[];
    currentZoom?: number;
    // Selected towers props
    selectedTowersLayer?: SelectedTowersVirtualLayer | null;
    onSelectedTowersToggle?: (isVisible: boolean) => void;
}


// Styled components
const ControlContainer = styled(Box)(({}) => ({
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
    zIndex: 1000,
    fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
    fontSize: '14px',
    transition: 'all 0.2s ease-in-out',
}));

const ControlToggle = styled(Box)({
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '5px',
    '&:hover': {
        backgroundColor: '#f4f4f4',
    },
    '& svg': {
        fontSize: '26px',
        color: '#555',
    }
});

const ControlContent = styled(Box)({
    minWidth: '220px',
    maxWidth: '320px',
    maxHeight: '80vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '10px',
    position: 'relative',

    '& .MuiFormControlLabel-root': {
        margin: '2px 0',
        width: '100%',
    },
    '& .MuiCheckbox-root, & .MuiRadio-root': {
        padding: '2px 8px',
        color: '#333',
        '&.Mui-checked': {
            color: '#333',
        }
    },
    '& .MuiFormControlLabel-label': {
        fontSize: '13px',
        fontWeight: 400,
        color: '#333',
        userSelect: 'none',
    }
});

const SectionHeader = styled(Typography)({
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '6px',
    marginTop: '8px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '2px',
    '&:first-of-type': {
        marginTop: '0',
    }
});

// New styled component for the Selected Towers section
const SelectedTowersSection = styled(Box)({
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '5px',
    padding: '8px',
    marginBottom: '12px',
});

const SelectedTowersHeader = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
});

const SelectedTowersTitle = styled(Typography)({
    fontSize: '13px',
    fontWeight: 600,
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
});

const SelectedTowersCount = styled(Typography)({
    fontSize: '11px',
    color: '#6c757d',
    fontStyle: 'italic',
});

const ExportButton = styled(Button)({
    fontSize: '11px',
    padding: '4px 12px',
    minWidth: 'auto',
    textTransform: 'none',
    borderRadius: '3px',
    '& .MuiButton-startIcon': {
        marginRight: '4px',
        '& svg': {
            fontSize: '16px',
        }
    }
});

const LayerGroupContainer = styled(Box)({
    marginBottom: '8px',
});

const LayerGroupHeader = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '4px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    '&:hover': {
        backgroundColor: '#f5f5f5',
    }
});

const LayerGroupContent = styled(Box)({
    paddingLeft: '16px',
});

const LayerItem = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
});

const BufferLayerItem = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '1px',
    paddingLeft: '24px', // Extra indent for buffer layers
    opacity: 0.9,
});

const ColorIndicator = styled('div')<{ layerColor: string; layerType: string }>(({ layerColor, layerType }) => ({
    width: '14px',
    height: '14px',
    backgroundColor: layerType === 'polygon' || layerType === 'Polygon Layer' ? 'transparent' : layerColor,
    border: `2px solid ${layerColor}`,
    borderRadius: layerType === 'point' || layerType === 'Point Layer' ? '50%' : '2px',
    flexShrink: 0,
}));

const BufferIndicator = styled('div')<{ bufferColor: string; distance: number }>(({ bufferColor, distance }) => ({
    width: '12px',
    height: '12px',
    backgroundColor: 'transparent',
    border: `2px solid ${bufferColor}`,
    borderRadius: '50%',
    borderStyle: distance === 2 ? 'solid' : 'dashed', // Solid for 2mi, dashed for 5mi
    flexShrink: 0,
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '4px',
        height: '4px',
        backgroundColor: bufferColor,
        borderRadius: '50%',
        opacity: 0.7,
    }
}));

const ZoomIndicator = styled(Box)<{ disabled: boolean }>(({ disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    color: disabled ? '#f44336' : '#4caf50',
    '& svg': {
        fontSize: '16px',
    }
}));

const ZoomRequirement = styled(Typography)({
    fontSize: '10px',
    color: '#f44336',
    fontStyle: 'italic',
    marginLeft: '20px',
    marginTop: '1px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
});

const BufferStats = styled(Typography)({
    fontSize: '10px',
    color: '#888',
    fontStyle: 'italic',
    marginLeft: '20px',
    marginTop: '2px',
});

const ZoomStatus = styled(Box)({
    backgroundColor: '#f0f0f0',
    padding: '6px 8px',
    borderRadius: '3px',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#666',
});

const StandaloneLayerControl: React.FC<StandaloneLayerControlProps> = ({
                                                                           projectData,
                                                                           visibleLayers,
                                                                           activeBasemap,
                                                                           onLayerToggle,
                                                                           onBasemapChange,
                                                                           towerBufferRelationships = [],
                                                                           onBufferToggle,
                                                                           bufferVisibility = {},
                                                                           zoomHints = [],
                                                                           currentZoom = 7,
                                                                           selectedTowersLayer,
                                                                           onSelectedTowersToggle}) => {

    const [isExpanded, setIsExpanded] = useState(false);
    const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
    const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => {
        if (projectData?.layer_groups && projectData.layer_groups.length > 0) {
            return new Set([projectData.layer_groups[0].id]);
        }
        return new Set();
    });

    const handleExportSelectedTowers = () => {
        const towers = selectedTowersManager.getSelectedTowers();
        if (towers.length === 0) {
            console.warn('No selected towers to export');
            return;
        }

        const csvData = towers.map(tower => ({
            id: tower.id,
            latitude: tower.coordinates[0],
            longitude: tower.coordinates[1],
            layer: tower.layerName,
            company: tower.companyName,
            ...tower.data
        }));

        exportCSV(csvData, 'selected_towers');
    };

    // Clear any existing timeout
    const clearCollapseTimeout = () => {
        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
            collapseTimeoutRef.current = null;
        }
    };

    const handleMouseEnter = () => {
        clearCollapseTimeout();
        if (!isExpanded) {
            setIsExpanded(true);
            setIsManuallyExpanded(false);
        }
    };

    const handleMouseLeave = () => {
        if (!isManuallyExpanded && isExpanded) {
            collapseTimeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 400);
        }
    };

    const toggleLayerGroup = (groupId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleControlClick = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        clearCollapseTimeout();
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        setIsManuallyExpanded(newExpanded);
    };

    // Function to extract color from layer style
    const getLayerColor = (layer: any): string => {
        // Special handling for Selected Towers
        if (layer.id === -1 || layer.name === 'Selected Towers') {
            return '#FFD700'; // Gold color for selected towers
        }

        if (layer.style?.fillColor) return layer.style.fillColor;
        if (layer.style?.color) return layer.style.color;
        if (layer.layer_type_name === 'Point Layer') return '#3388ff';
        if (layer.layer_type_name === 'Line Layer') return '#3388ff';
        if (layer.layer_type_name === 'Polygon Layer') return '#3388ff';
        return '#3388ff';
    };


    // Check if a layer is an antenna tower layer
    const isAntennaTowerLayer = (layerName: string): boolean => {
        return layerName.toLowerCase().includes('antenna locations') ||
            layerName.toLowerCase() === 'selected towers';
    };


    // Find tower buffer relationship for a layer
    const getTowerBufferRelationship = (layerId: number): TowerWithBuffers | undefined => {
        return towerBufferRelationships.find(rel => rel.towerId === layerId);
    };

    // Get zoom status for a layer
    const getLayerZoomStatus = (layerId: number): { canShow: boolean; needsZoom: number | null } => {
        return zoomVisibilityManager.getLayerZoomStatus(layerId);
    };

    // Check if layer is hidden due to zoom
    const isLayerHiddenByZoom = (layerId: number): boolean => {
        const status = getLayerZoomStatus(layerId);
        return !status.canShow;
    };

    // Handle buffer toggle
    const handleBufferToggle = (bufferId: string, isVisible: boolean) => {
        if (onBufferToggle) {
            onBufferToggle(bufferId, isVisible);
        }
    };

    // Format buffer statistics
    const formatBufferStats = (buffer: VirtualBufferLayer): string => {
        return `${buffer.featureCount} coverage area${buffer.featureCount !== 1 ? 's' : ''}`;
    };

    // Format zoom requirement message
    const formatZoomRequirement = (needsZoom: number): string => {
        const zoomDiff = needsZoom - currentZoom;
        return `Zoom in ${zoomDiff} more level${zoomDiff !== 1 ? 's' : ''}`;
    };

    // Get selected towers count
    const getSelectedTowersCount = (): number => {
        return selectedTowersManager.getSelectedTowers().length;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearCollapseTimeout();
        };
    }, []);

    return (
        <ControlContainer
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {!isExpanded ? (
                <ControlToggle onClick={handleControlClick}>
                    <LayersIcon />
                </ControlToggle>
            ) : (
                <ControlContent>
                    {/* Close button for manually expanded state */}
                    {isManuallyExpanded && (
                        <IconButton
                            size="small"
                            onClick={handleControlClick}
                            sx={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                padding: '4px',
                                '& svg': {
                                    fontSize: '18px',
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}

                    {/* Selected Towers Section - NEW: Added at the top */}
                    {getSelectedTowersCount() > 0 && (
                        <SelectedTowersSection>
                            <SelectedTowersHeader>
                                <SelectedTowersTitle>
                                    <ColorIndicator
                                        layerColor="#FFD700"
                                        layerType="Point Layer"
                                    />
                                    Selected Towers
                                </SelectedTowersTitle>
                                <ExportButton
                                    variant="contained"
                                    size="small"
                                    startIcon={<GetAppIcon />}
                                    onClick={handleExportSelectedTowers}
                                    color="primary"
                                >
                                    Export
                                </ExportButton>
                            </SelectedTowersHeader>
                            <SelectedTowersCount>
                                {getSelectedTowersCount()} tower{getSelectedTowersCount() !== 1 ? 's' : ''} selected
                            </SelectedTowersCount>
                        </SelectedTowersSection>
                    )}

                    {/* Zoom status indicator */}
                    <ZoomStatus>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Zoom Level: {currentZoom}
                        </Typography>
                        {zoomHints.length > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#f44336', marginTop: '2px' }}>
                                {zoomHints.length} tower layer{zoomHints.length !== 1 ? 's' : ''} hidden
                            </Typography>
                        )}
                    </ZoomStatus>

                    {/* Basemaps section */}
                    {projectData.basemaps && projectData.basemaps.length > 0 && (
                        <>
                            <SectionHeader sx={{ marginTop: isManuallyExpanded ? '24px' : '0' }}>
                                Base Maps
                            </SectionHeader>
                            <RadioGroup
                                value={activeBasemap || ''}
                                onChange={(e) => onBasemapChange(Number(e.target.value))}
                            >
                                {projectData.basemaps.map((basemap: any) => (
                                    <FormControlLabel
                                        key={basemap.id}
                                        value={basemap.id}
                                        control={<Radio size="small" />}
                                        label={basemap.name}
                                    />
                                ))}
                            </RadioGroup>
                        </>
                    )}

                    {/* Layer groups section */}
                    {projectData.layer_groups && projectData.layer_groups.length > 0 && (
                        <>
                            <SectionHeader>Layers</SectionHeader>

                            {projectData.layer_groups.map((group: any) => (
                                <LayerGroupContainer key={group.id}>
                                    <LayerGroupHeader onClick={(e) => toggleLayerGroup(group.id, e)}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                                            {group.name}
                                        </Typography>
                                        <IconButton size="small" sx={{ padding: '2px' }}>
                                            {expandedGroups.has(group.id) ?
                                                <ExpandLessIcon sx={{ fontSize: '18px' }} /> :
                                                <ExpandMoreIcon sx={{ fontSize: '18px' }} />
                                            }
                                        </IconButton>
                                    </LayerGroupHeader>

                                    <Collapse in={expandedGroups.has(group.id)}>
                                        <LayerGroupContent>
                                            {group.layers?.map((layer: any) => {
                                                const isChecked = visibleLayers.has(layer.id);
                                                const isTowerLayer = isAntennaTowerLayer(layer.name);
                                                const towerRelationship = getTowerBufferRelationship(layer.id);
                                                const layerVisible = visibleLayers.has(layer.id);
                                                const zoomStatus = getLayerZoomStatus(layer.id);
                                                const hiddenByZoom = isChecked && isTowerLayer && !zoomStatus.canShow;

                                                return (
                                                    <Box key={layer.id}>
                                                        {/* Main layer item */}
                                                        <LayerItem>
                                                            <ColorIndicator
                                                                layerColor={getLayerColor(layer)}
                                                                layerType={layer.layer_type_name}
                                                            />
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={layerVisible}
                                                                        onChange={() => onLayerToggle(layer.id)}
                                                                        size="small"
                                                                    />
                                                                }
                                                                label={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: '13px',
                                                                                color: (isTowerLayer && isChecked && hiddenByZoom)
                                                                                    ? '#999'
                                                                                    : isChecked
                                                                                        ? '#333'
                                                                                        : '#333',
                                                                                fontStyle: (isTowerLayer && isChecked && hiddenByZoom) ? 'italic' : 'normal'
                                                                            }}
                                                                        >
                                                                            {layer.name}
                                                                        </Typography>
                                                                        {isTowerLayer && (
                                                                            <Tooltip title={hiddenByZoom ? `Minimum zoom: ${zoomStatus.needsZoom}` : 'Zoom controlled'}>
                                                                                <ZoomIndicator disabled={hiddenByZoom}>
                                                                                    {hiddenByZoom ? <VisibilityOffIcon /> : <ZoomInIcon />}
                                                                                </ZoomIndicator>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Box>
                                                                }
                                                                sx={{ margin: 0, flex: 1 }}
                                                            />
                                                        </LayerItem>

                                                        {/* Zoom requirement message */}
                                                        {isTowerLayer && isChecked && hiddenByZoom && zoomStatus.needsZoom && (
                                                            <ZoomRequirement>
                                                                <ZoomInIcon sx={{ fontSize: '12px' }} />
                                                                {formatZoomRequirement(zoomStatus.needsZoom)}
                                                            </ZoomRequirement>
                                                        )}

                                                        {/* Buffer layers for antenna towers */}
                                                        {isTowerLayer && towerRelationship && layerVisible && !hiddenByZoom && (
                                                            <Box sx={{ marginTop: '4px', marginBottom: '8px' }}>
                                                                {towerRelationship.buffers.map((buffer: VirtualBufferLayer) => {
                                                                    const bufferVisible = bufferVisibility[buffer.id] || false;

                                                                    return (
                                                                        <Box key={buffer.id}>
                                                                            <BufferLayerItem>
                                                                                <BufferIndicator
                                                                                    bufferColor={buffer.color}
                                                                                    distance={buffer.distance}
                                                                                />
                                                                                <FormControlLabel
                                                                                    control={
                                                                                        <Checkbox
                                                                                            checked={bufferVisible}
                                                                                            onChange={(e) => handleBufferToggle(buffer.id, e.target.checked)}
                                                                                            size="small"
                                                                                            disabled={!layerVisible}
                                                                                        />
                                                                                    }
                                                                                    label={`${buffer.distance} mile coverage`}
                                                                                    sx={{
                                                                                        margin: 0,
                                                                                        flex: 1,
                                                                                        '& .MuiFormControlLabel-label': {
                                                                                            fontSize: '12px',
                                                                                            fontStyle: 'italic',
                                                                                            color: layerVisible ? '#666' : '#ccc'
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </BufferLayerItem>

                                                                            {/* Buffer statistics */}
                                                                            {layerVisible && (
                                                                                <BufferStats>
                                                                                    {formatBufferStats(buffer)}
                                                                                </BufferStats>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </LayerGroupContent>
                                    </Collapse>
                                </LayerGroupContainer>
                            ))}
                        </>
                    )}

                    {/* System statistics - moved to bottom and simplified */}
                    {(towerBufferRelationships.length > 0 || zoomHints.length > 0) && (
                        <Box sx={{ marginTop: '8px', padding: '4px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
                            {towerBufferRelationships.length > 0 && (
                                <Typography variant="caption" sx={{ fontSize: '10px', color: '#666', display: 'block' }}>
                                    Coverage: {towerBufferRelationships.length} tower group{towerBufferRelationships.length !== 1 ? 's' : ''}
                                    {' • '}
                                    {towerBufferRelationships.reduce((sum, tower) => sum + tower.buffers.length, 0)} buffer layer{towerBufferRelationships.reduce((sum, tower) => sum + tower.buffers.length, 0) !== 1 ? 's' : ''}
                                </Typography>
                            )}
                            <Typography variant="caption" sx={{ fontSize: '10px', color: '#666', display: 'block' }}>
                                Zoom: Level {currentZoom} • Min for towers: {zoomVisibilityManager.getMinZoomForTowers()}
                            </Typography>
                        </Box>
                    )}
                </ControlContent>
            )}
        </ControlContainer>
    );
};

export default StandaloneLayerControl;