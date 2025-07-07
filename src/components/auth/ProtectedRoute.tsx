
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    adminOnly?: boolean;
    [key: string]: any;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                           component: Component,
                                                           adminOnly = false,
                                                           ...props
                                                       }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                gap={2}
            >
                <CircularProgress />
                <Typography variant="body1">Loading...</Typography>
            </Box>
        );
    }

    // Redirect to login if not authenticated, preserving the current location
    if (!isAuthenticated) {
        const redirectUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
    }

    // Check admin access if required
    if (adminOnly && user && !user.is_staff) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <Typography variant="h6" color="error">
                    Access denied. Admin privileges required.
                </Typography>
            </Box>
        );
    }

    // Render the component
    return <Component {...props} />;
};

export default ProtectedRoute;