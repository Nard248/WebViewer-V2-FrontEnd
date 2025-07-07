
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid } from '@mui/material';
import { layerDataCache } from '../../utils/LayerDataCache';

const CacheManager: React.FC = () => {
    const [cacheInfo, setCacheInfo] = useState<any>(null);

    const refreshCacheInfo = () => {
        const info = layerDataCache.getCacheInfo();
        setCacheInfo(info);
    };

    useEffect(() => {
        refreshCacheInfo();
    }, []);

    const handleClearCache = () => {
        layerDataCache.clearAllCache();
        refreshCacheInfo();
        console.log('All cache cleared');
    };

    const handleCleanupExpired = () => {
        layerDataCache.cleanupExpiredCache();
        refreshCacheInfo();
        console.log('Expired cache cleaned up');
    };

    return (
        <Paper elevation={2} sx={{ p: 3, m: 2 }}>
            <Typography variant="h6" gutterBottom>
                Layer Data Cache Management
            </Typography>

            {cacheInfo && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                            Memory Entries: {cacheInfo.memoryEntries}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                            Storage Entries: {cacheInfo.localStorageEntries}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                            Total Size: {cacheInfo.totalSize}
                        </Typography>
                    </Grid>
                </Grid>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={refreshCacheInfo}>
                    Refresh Info
                </Button>
                <Button variant="outlined" onClick={handleCleanupExpired}>
                    Cleanup Expired
                </Button>
                <Button variant="contained" color="warning" onClick={handleClearCache}>
                    Clear All Cache
                </Button>
            </Box>
        </Paper>
    );
};

export default CacheManager;