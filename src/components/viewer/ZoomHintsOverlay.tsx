import React from 'react';
import { Box, Typography } from '@mui/material';
import { ZoomHint, createZoomHintMessage } from './ZoomVisibilityManager';

interface Props {
    zoomHints: ZoomHint[];
    currentZoom: number;
}

const ZoomHintsOverlay: React.FC<Props> = ({ zoomHints, currentZoom }) => {
    if (!zoomHints || zoomHints.length === 0) return null;

    return (
        <Box
            position="absolute"
            bottom="50px"
            left="10px"
            bgcolor="rgba(0,0,0,0.8)"
            color="white"
            padding="8px 12px"
            borderRadius="5px"
            zIndex={1000}
            maxWidth="300px"
        >
            <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600 }}>
                Zoom Level: {currentZoom}
            </Typography>
            {zoomHints.map((hint, index) => (
                <Typography key={index} variant="body2" sx={{ fontSize: '11px', marginTop: '2px' }}>
                    {createZoomHintMessage([hint])}
                </Typography>
            ))}
        </Box>
    );
};

export default ZoomHintsOverlay;


