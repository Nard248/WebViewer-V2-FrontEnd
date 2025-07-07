// src/components/viewer/StandaloneLoadingScreen.tsx
import React from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import StandaloneHeader from './StandaloneHeader'; // Add this line

interface StandaloneLoadingScreenProps {
    progress: number;
    projectName?: string;
    statusMessage?: string; // Add this new prop
}

const LoadingContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 48px)',
    marginTop: '48px',
    backgroundColor: '#f5f5f5',
});

const LoadingContent = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
});

const Spinner = styled(Box)({
    width: '60px',
    height: '60px',
    position: 'relative',
    '& svg': {
        animation: 'rotate 2s linear infinite',
        width: '100%',
        height: '100%',
    },
    '@keyframes rotate': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
    }
});

const ProgressBarContainer = styled(Box)({
    width: '600px',
    maxWidth: '90vw',
    marginTop: '20px',
});

const CustomLinearProgress = styled(LinearProgress)({
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#e0e0e0',
    '& .MuiLinearProgress-bar': {
        backgroundColor: '#4CAF50',
        borderRadius: '10px',
    }
});

const LoadingText = styled(Typography)({
    fontSize: '16px',
    color: '#333',
    marginTop: '10px',
});

const StandaloneLoadingScreen: React.FC<StandaloneLoadingScreenProps> = ({
                                                                             progress,
                                                                             projectName,
                                                                             statusMessage = 'Loading...' // Default message
                                                                         }) => {
    return (
        <>
            <StandaloneHeader />
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="calc(100vh - 48px)"
                marginTop="48px"
                sx={{ backgroundColor: '#f5f5f5' }}
            >
                <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        {projectName ? `Loading ${projectName}` : 'Loading Project'}
                    </Typography>

                    {/* Add status message */}
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3, minHeight: '20px' }}>
                        {statusMessage}
                    </Typography>

                    <Box sx={{ width: '100%', mb: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>

                    <Typography variant="body2" color="textSecondary">
                        {Math.round(progress)}%
                    </Typography>

                    {/* Add cache info if available */}
                    {progress > 30 && (
                        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                            Data will be cached for 30 minutes for faster access
                        </Typography>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default StandaloneLoadingScreen;