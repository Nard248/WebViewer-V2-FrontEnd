import React, { ComponentType } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useClientAuth } from '../../context/ClientAuthContext';

interface ClientProtectedRouteProps {
    component: ComponentType<any>;
    requiredPermissions?: string[];
    fallback?: ComponentType<any>;
}

/**
 * Component that protects client routes by checking authentication
 * and optionally required permissions
 */
const ClientProtectedRoute: React.FC<ClientProtectedRouteProps> = ({
    component: Component,
    requiredPermissions = [],
    fallback: FallbackComponent,
    ...props
}) => {
    const { isAuthenticated, isLoading, user, error, refreshToken } = useClientAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={48} />
                <Typography variant="h6" color="text.secondary">
                    Authenticating...
                </Typography>
            </Box>
        );
    }

    // Show error state with retry option
    if (error && !isAuthenticated) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                gap={2}
                px={2}
            >
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={refreshToken}>
                            <Refresh />
                            Retry
                        </Button>
                    }
                    sx={{ maxWidth: 400 }}
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/client-auth/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // Check if user account is active
    if (user && !user.isActive) {
        if (FallbackComponent) {
            return <FallbackComponent {...props} />;
        }

        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                gap={2}
                px={2}
            >
                <Alert severity="warning" sx={{ maxWidth: 400 }}>
                    Your account is currently inactive. Please contact your administrator for assistance.
                </Alert>
            </Box>
        );
    }

    // Check required permissions if specified
    if (requiredPermissions.length > 0 && user) {
        const hasRequiredPermissions = requiredPermissions.every(permission =>
            user.permissions.includes(permission)
        );

        if (!hasRequiredPermissions) {
            if (FallbackComponent) {
                return <FallbackComponent {...props} />;
            }

            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                    gap={2}
                    px={2}
                >
                    <Alert severity="error" sx={{ maxWidth: 400 }}>
                        You don't have permission to access this page.
                        Required permissions: {requiredPermissions.join(', ')}
                    </Alert>
                </Box>
            );
        }
    }

    // All checks passed, render the protected component
    return <Component {...props} />;
};

export default ClientProtectedRoute;