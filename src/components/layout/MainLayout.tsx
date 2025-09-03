// src/components/layout/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Toolbar, useMediaQuery, ThemeProvider } from '@mui/material';
import { AppBar } from './AppBar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { createAppTheme } from '../../theme';

const DRAWER_WIDTH = 240;

export const MainLayout: React.FC = () => {
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState('WebGIS Viewer V2');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
    const location = useLocation();
    const isMobile = useMediaQuery('(max-width:900px)');

    // Set the drawer to closed by default on mobile
    useEffect(() => {
        if (isMobile) {
            setOpen(false);
        }
    }, [isMobile]);

    // Update title based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('project-viewer')) {
            setTitle('Project Viewer');
        } else if (path.includes('dashboard')) {
            setTitle('Dashboard');
        } else if (path.includes('projects')) {
            setTitle('Projects');
        } else if (path.includes('layers')) {
            setTitle('Layers');
        } else if (path.includes('clients')) {
            setTitle('Clients');
        } else if (path.includes('settings')) {
            setTitle('Settings');
        } else if (path.includes('analytics')) {
            setTitle('Analytics');
        } else if (path.includes('basemaps')) {
            setTitle('Basemaps');
        } else if (path.includes('styles')) {
            setTitle('Styles');
        } else if (path.includes('datasources')) {
            setTitle('Data Sources');
        } else if (path.includes('profile')) {
            setTitle('User Profile');
        } else {
            setTitle('WebGIS Viewer V2');
        }
    }, [location]);

    const handleToggleDrawer = () => {
        setOpen(!open);
    };

    const handleToggleThemeMode = () => {
        setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    const theme = createAppTheme(themeMode);

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />

                <AppBar
                    title={title}
                    onToggleDrawer={handleToggleDrawer}
                    drawerWidth={DRAWER_WIDTH}
                    onToggleThemeMode={handleToggleThemeMode}
                    themeMode={themeMode}
                />

                <Sidebar
                    open={open}
                    onClose={() => setOpen(false)}
                    drawerWidth={DRAWER_WIDTH}
                />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)` },
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Toolbar /> {/* This adds spacing below the AppBar */}
                    <Outlet /> {/* This renders the current route */}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default MainLayout;
