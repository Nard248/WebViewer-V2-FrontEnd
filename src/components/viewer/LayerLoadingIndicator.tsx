import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LayerLoadingIndicatorProps {
    loadingLayers: Set<number>;
    getLayerNameById: (layerId: number) => string;
}

/**
 * Component to display loading indicators for layers being loaded on-demand
 */
const LayerLoadingIndicator: React.FC<LayerLoadingIndicatorProps> = ({ 
    loadingLayers,
    getLayerNameById
}) => {
    if (loadingLayers.size === 0) {
        return null;
    }

    return (
        <Box
            position="absolute"
            bottom={16}
            left={16}
            zIndex={1000}
            bgcolor="rgba(255, 255, 255, 0.8)"
            borderRadius={1}
            boxShadow={2}
            padding={2}
            maxWidth={300}
        >
            <Box display="flex" alignItems="center" mb={1}>
                <CircularProgress size={20} thickness={5} sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Loading layers...</Typography>
            </Box>
            
            {Array.from(loadingLayers).map(layerId => (
                <Typography key={layerId} variant="caption" display="block" sx={{ ml: 3 }}>
                    {getLayerNameById(layerId) || `Layer ${layerId}`}
                </Typography>
            ))}
        </Box>
    );
};

export default LayerLoadingIndicator;
