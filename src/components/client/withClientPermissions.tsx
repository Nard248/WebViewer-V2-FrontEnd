import React, { ComponentType, FC } from 'react';
import { Box, Alert, CircularProgress, Button, Typography, Paper } from '@mui/material';
import { Lock, Warning, Refresh } from '@mui/icons-material';
import { useClientPermissions, ClientPermissions } from '../../hooks/useClientPermissions';

interface WithClientPermissionsOptions {
    // Required permissions to access the component
    requiredPermissions?: (keyof ClientPermissions)[];
    // Whether ALL permissions are required (default: false, meaning ANY permission is sufficient)
    requireAll?: boolean;
    // Custom fallback component when permissions are insufficient
    fallback?: ComponentType<{ permissions: ClientPermissions; retry: () => void }>;
    // Whether to show loading spinner while checking permissions
    showLoading?: boolean;
    // Custom error component for permission denied
    deniedComponent?: ComponentType<{ permissions: ClientPermissions; retry: () => void }>;
    // Custom component for expired permissions
    expiredComponent?: ComponentType<{ permissions: ClientPermissions; retry: () => void }>;
}

interface InjectedPermissionProps {
    permissions: ReturnType<typeof useClientPermissions>;
}

/**
 * Higher-Order Component that wraps components with client permission checks
 * @param WrappedComponent - Component to wrap with permission checks
 * @param options - Configuration options for permission requirements
 * @returns Enhanced component with permission checking
 */
export function withClientPermissions<P extends object>(
    WrappedComponent: ComponentType<P & InjectedPermissionProps>,
    options: WithClientPermissionsOptions = {}
) {
    const {
        requiredPermissions = [],
        requireAll = false,
        fallback: CustomFallback,
        showLoading = true,
        deniedComponent: CustomDeniedComponent,
        expiredComponent: CustomExpiredComponent
    } = options;

    const PermissionWrappedComponent: FC<P & { projectId?: string }> = (props) => {
        const permissions = useClientPermissions(props.projectId);
        const { permissions: permissionState, loading, error, refetch } = permissions;

        // Show loading state
        if (loading && showLoading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        Loading permissions...
                    </Typography>
                </Box>
            );
        }

        // Show error state
        if (error) {
            return (
                <Alert 
                    severity="error" 
                    action={
                        <Button color="inherit" size="small" onClick={refetch}>
                            <Refresh />
                            Retry
                        </Button>
                    }
                    sx={{ m: 2 }}
                >
                    {error}
                </Alert>
            );
        }

        // Check if permissions are expired
        if (permissionState.isExpired) {
            if (CustomExpiredComponent) {
                return <CustomExpiredComponent permissions={permissionState} retry={refetch} />;
            }
            
            return (
                <Paper sx={{ p: 3, textAlign: 'center', m: 2 }}>
                    <Warning color="warning" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Access Expired
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Your access to this project has expired.
                        {permissionState.expiresAt && (
                            ` Expired on ${permissionState.expiresAt.toLocaleDateString()}.`
                        )}
                    </Typography>
                    <Button variant="outlined" onClick={refetch} sx={{ mt: 2 }}>
                        <Refresh sx={{ mr: 1 }} />
                        Check Again
                    </Button>
                </Paper>
            );
        }

        // Check if project is inactive
        if (!permissionState.isActive) {
            return (
                <Paper sx={{ p: 3, textAlign: 'center', m: 2 }}>
                    <Lock color="action" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Project Inactive
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        This project is currently inactive and cannot be accessed.
                    </Typography>
                </Paper>
            );
        }

        // Check required permissions
        if (requiredPermissions.length > 0) {
            const hasPermission = requireAll
                ? requiredPermissions.every(perm => permissionState[perm])
                : requiredPermissions.some(perm => permissionState[perm]);

            if (!hasPermission) {
                if (CustomDeniedComponent) {
                    return <CustomDeniedComponent permissions={permissionState} retry={refetch} />;
                }

                if (CustomFallback) {
                    return <CustomFallback permissions={permissionState} retry={refetch} />;
                }

                return (
                    <Paper sx={{ p: 3, textAlign: 'center', m: 2 }}>
                        <Lock color="error" sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Insufficient Permissions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            You don't have the required permissions to access this feature.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Required: {requiredPermissions.join(requireAll ? ' and ' : ' or ')}
                        </Typography>
                        <Button variant="outlined" onClick={refetch} sx={{ mt: 2 }}>
                            <Refresh sx={{ mr: 1 }} />
                            Refresh Permissions
                        </Button>
                    </Paper>
                );
            }
        }

        // All checks passed, render the wrapped component
        return <WrappedComponent {...props} permissions={permissions} />;
    };

    // Set display name for debugging
    PermissionWrappedComponent.displayName = `withClientPermissions(${WrappedComponent.displayName || WrappedComponent.name})`;

    return PermissionWrappedComponent;
}

/**
 * Component that conditionally renders children based on permissions
 */
interface PermissionGateProps {
    projectId?: string;
    requiredPermissions?: (keyof ClientPermissions)[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
    layerId?: string;
    layerPermissions?: string[];
}

export const PermissionGate: FC<PermissionGateProps> = ({
    projectId,
    requiredPermissions = [],
    requireAll = false,
    fallback = null,
    children,
    layerId,
    layerPermissions = []
}) => {
    const { permissions, loading, checkPermission, checkLayerPermission } = useClientPermissions(projectId);

    if (loading) {
        return null; // Don't show loading in permission gates
    }

    // Check project-level permissions
    if (requiredPermissions.length > 0) {
        const hasPermission = requireAll
            ? requiredPermissions.every(perm => checkPermission(perm))
            : requiredPermissions.some(perm => checkPermission(perm));

        if (!hasPermission) {
            return <>{fallback}</>;
        }
    }

    // Check layer-level permissions
    if (layerId && layerPermissions.length > 0) {
        const hasLayerPermission = layerPermissions.every(perm => 
            checkLayerPermission(layerId, perm as any)
        );

        if (!hasLayerPermission) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
};

/**
 * Hook to conditionally render content based on permissions
 */
export const usePermissionGate = (
    projectId?: string,
    requiredPermissions: (keyof ClientPermissions)[] = [],
    requireAll = false
) => {
    const { permissions, checkPermission } = useClientPermissions(projectId);

    const hasPermission = requiredPermissions.length === 0 ? true :
        requireAll
            ? requiredPermissions.every(perm => checkPermission(perm))
            : requiredPermissions.some(perm => checkPermission(perm));

    return {
        permissions,
        hasPermission,
        canRender: hasPermission && permissions.isActive && !permissions.isExpired
    };
};

/**
 * Utility component for displaying permission status
 */
interface PermissionStatusProps {
    projectId?: string;
    showDetails?: boolean;
}

export const PermissionStatus: FC<PermissionStatusProps> = ({ 
    projectId, 
    showDetails = false 
}) => {
    const { permissions, loading, error } = useClientPermissions(projectId);

    if (loading) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="caption">Loading permissions...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ maxWidth: 400 }}>
                {error}
            </Alert>
        );
    }

    const getStatusColor = () => {
        if (permissions.isExpired) return 'error';
        if (!permissions.isActive) return 'warning';
        if (permissions.canView) return 'success';
        return 'default';
    };

    const getStatusText = () => {
        if (permissions.isExpired) return 'Expired';
        if (!permissions.isActive) return 'Inactive';
        if (permissions.canView) return 'Active';
        return 'No Access';
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color={`${getStatusColor()}.main`}>
                    Status: {getStatusText()}
                </Typography>
                {permissions.expiresAt && (
                    <Typography variant="caption" color="text.secondary">
                        Expires: {permissions.expiresAt.toLocaleDateString()}
                    </Typography>
                )}
            </Box>
            
            {showDetails && (
                <Box mt={1}>
                    <Typography variant="caption" display="block">
                        Permissions:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {(['canView', 'canEdit', 'canExport', 'canShare'] as const).map(perm => (
                            <Box
                                key={perm}
                                sx={{
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                    bgcolor: permissions[perm] ? 'success.light' : 'grey.200',
                                    color: permissions[perm] ? 'success.contrastText' : 'text.secondary'
                                }}
                            >
                                <Typography variant="caption">
                                    {perm.replace('can', '')}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};