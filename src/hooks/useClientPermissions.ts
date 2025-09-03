import { useState, useEffect, useMemo } from 'react';
import { clientWorkspaceService, ClientProjectAccess } from '../services/clientWorkspaceService';

export interface ClientPermissions {
    canView: boolean;
    canEdit: boolean;
    canExport: boolean;
    canShare: boolean;
    canViewAnalytics: boolean;
}

export interface LayerPermissions {
    [layerId: string]: {
        canView: boolean;
        canEdit: boolean;
        canStyle: boolean;
        canDelete: boolean;
    };
}

export interface ProjectPermissions extends ClientPermissions {
    projectId: number | null;
    layerPermissions: LayerPermissions;
    isExpired: boolean;
    isActive: boolean;
    expiresAt: Date | null;
    lastAccessed: Date | null;
}

interface UseClientPermissionsReturn {
    permissions: ProjectPermissions;
    loading: boolean;
    error: string | null;
    checkPermission: (action: keyof ClientPermissions) => boolean;
    checkLayerPermission: (layerId: string, action: keyof LayerPermissions[string]) => boolean;
    hasAnyPermission: (actions: (keyof ClientPermissions)[]) => boolean;
    hasAllPermissions: (actions: (keyof ClientPermissions)[]) => boolean;
    refetch: () => Promise<void>;
}

/**
 * Hook to manage client permissions for a specific project
 * @param projectId - The project ID to check permissions for
 * @returns Object containing permission state and helper functions
 */
export const useClientPermissions = (projectId?: string): UseClientPermissionsReturn => {
    const [permissions, setPermissions] = useState<ProjectPermissions>({
        projectId: projectId ? parseInt(projectId) : null,
        canView: false,
        canEdit: false,
        canExport: false,
        canShare: false,
        canViewAnalytics: false,
        layerPermissions: {},
        isExpired: false,
        isActive: false,
        expiresAt: null,
        lastAccessed: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPermissions = async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const projectAccess: ClientProjectAccess = await clientWorkspaceService.getProject(projectId);
            
            // Check if project is expired
            const now = new Date();
            const expiresAt = projectAccess.expiresAt ? new Date(projectAccess.expiresAt) : null;
            const isExpired = expiresAt ? now > expiresAt : false;

            // Transform API response to internal permission format
            const layerPermissions: LayerPermissions = {};
            Object.entries(projectAccess.permissions.layerPermissions).forEach(([layerId, actions]) => {
                layerPermissions[layerId] = {
                    canView: actions.includes('view'),
                    canEdit: actions.includes('edit'),
                    canStyle: actions.includes('style'),
                    canDelete: actions.includes('delete')
                };
            });

            setPermissions({
                projectId: projectAccess.projectId,
                canView: projectAccess.permissions.canView && !isExpired,
                canEdit: projectAccess.permissions.canEdit && !isExpired,
                canExport: projectAccess.permissions.canExport && !isExpired,
                canShare: projectAccess.permissions.canShare && !isExpired,
                canViewAnalytics: projectAccess.permissions.canView && !isExpired, // Assuming analytics requires view permission
                layerPermissions: isExpired ? {} : layerPermissions,
                isExpired,
                isActive: projectAccess.isActive,
                expiresAt,
                lastAccessed: projectAccess.lastAccessed ? new Date(projectAccess.lastAccessed) : null
            });
        } catch (err) {
            console.error('Error fetching project permissions:', err);
            setError('Failed to load project permissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [projectId]);

    // Helper function to check a specific permission
    const checkPermission = (action: keyof ClientPermissions): boolean => {
        if (permissions.isExpired || !permissions.isActive) {
            return false;
        }
        return permissions[action];
    };

    // Helper function to check layer-specific permissions
    const checkLayerPermission = (layerId: string, action: keyof LayerPermissions[string]): boolean => {
        if (permissions.isExpired || !permissions.isActive) {
            return false;
        }
        
        const layerPerms = permissions.layerPermissions[layerId];
        return layerPerms ? layerPerms[action] : false;
    };

    // Helper function to check if user has any of the specified permissions
    const hasAnyPermission = (actions: (keyof ClientPermissions)[]): boolean => {
        return actions.some(action => checkPermission(action));
    };

    // Helper function to check if user has all of the specified permissions
    const hasAllPermissions = (actions: (keyof ClientPermissions)[]): boolean => {
        return actions.every(action => checkPermission(action));
    };

    return {
        permissions,
        loading,
        error,
        checkPermission,
        checkLayerPermission,
        hasAnyPermission,
        hasAllPermissions,
        refetch: fetchPermissions
    };
};

/**
 * Hook to get permissions for multiple projects
 * @param projectIds - Array of project IDs
 * @returns Object with permissions mapped by project ID
 */
export const useMultipleClientPermissions = (projectIds: string[]) => {
    const [permissionsMap, setPermissionsMap] = useState<Record<string, ProjectPermissions>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllPermissions = async () => {
            if (projectIds.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const permissionPromises = projectIds.map(async (projectId) => {
                    try {
                        const projectAccess = await clientWorkspaceService.getProject(projectId);
                        
                        const now = new Date();
                        const expiresAt = projectAccess.expiresAt ? new Date(projectAccess.expiresAt) : null;
                        const isExpired = expiresAt ? now > expiresAt : false;

                        const layerPermissions: LayerPermissions = {};
                        Object.entries(projectAccess.permissions.layerPermissions).forEach(([layerId, actions]) => {
                            layerPermissions[layerId] = {
                                canView: actions.includes('view'),
                                canEdit: actions.includes('edit'),
                                canStyle: actions.includes('style'),
                                canDelete: actions.includes('delete')
                            };
                        });

                        return {
                            projectId,
                            permissions: {
                                projectId: projectAccess.projectId,
                                canView: projectAccess.permissions.canView && !isExpired,
                                canEdit: projectAccess.permissions.canEdit && !isExpired,
                                canExport: projectAccess.permissions.canExport && !isExpired,
                                canShare: projectAccess.permissions.canShare && !isExpired,
                                canViewAnalytics: projectAccess.permissions.canView && !isExpired,
                                layerPermissions: isExpired ? {} : layerPermissions,
                                isExpired,
                                isActive: projectAccess.isActive,
                                expiresAt,
                                lastAccessed: projectAccess.lastAccessed ? new Date(projectAccess.lastAccessed) : null
                            }
                        };
                    } catch (err) {
                        console.error(`Error fetching permissions for project ${projectId}:`, err);
                        return null;
                    }
                });

                const results = await Promise.all(permissionPromises);
                const newPermissionsMap: Record<string, ProjectPermissions> = {};
                
                results.forEach((result) => {
                    if (result) {
                        newPermissionsMap[result.projectId] = result.permissions;
                    }
                });

                setPermissionsMap(newPermissionsMap);
            } catch (err) {
                console.error('Error fetching multiple project permissions:', err);
                setError('Failed to load project permissions');
            } finally {
                setLoading(false);
            }
        };

        fetchAllPermissions();
    }, [JSON.stringify(projectIds)]);

    return {
        permissionsMap,
        loading,
        error,
        getPermissions: (projectId: string) => permissionsMap[projectId] || null
    };
};

/**
 * Hook to get the current user's overall client permissions
 * @returns Global client permissions and capabilities
 */
export const useGlobalClientPermissions = () => {
    const [globalPermissions, setGlobalPermissions] = useState({
        canAccessWorkspace: false,
        canViewProjects: false,
        canExportData: false,
        canShareProjects: false,
        canViewAnalytics: false,
        canCollaborate: false,
        maxProjects: 0,
        maxExportsPerDay: 0,
        allowedFormats: [] as string[]
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGlobalPermissions = async () => {
            setLoading(true);
            setError(null);

            try {
                // In a real implementation, this would call an API endpoint
                // For now, we'll use mock data
                setGlobalPermissions({
                    canAccessWorkspace: true,
                    canViewProjects: true,
                    canExportData: true,
                    canShareProjects: false,
                    canViewAnalytics: true,
                    canCollaborate: false,
                    maxProjects: 10,
                    maxExportsPerDay: 5,
                    allowedFormats: ['csv', 'json', 'pdf']
                });
            } catch (err) {
                console.error('Error fetching global permissions:', err);
                setError('Failed to load global permissions');
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalPermissions();
    }, []);

    return {
        globalPermissions,
        loading,
        error
    };
};

/**
 * Custom hook to track permission usage and limits
 * @returns Permission usage statistics
 */
export const usePermissionUsage = () => {
    const [usage, setUsage] = useState({
        projectsViewed: 0,
        exportsToday: 0,
        sharesThisMonth: 0,
        collaborationInvites: 0,
        lastActivity: null as Date | null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            setLoading(true);
            try {
                // Mock data - in real implementation, fetch from API
                setUsage({
                    projectsViewed: 3,
                    exportsToday: 1,
                    sharesThisMonth: 0,
                    collaborationInvites: 0,
                    lastActivity: new Date()
                });
            } catch (err) {
                console.error('Error fetching permission usage:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, []);

    return {
        usage,
        loading,
        refreshUsage: () => {
            // In real implementation, refetch usage data
        }
    };
};