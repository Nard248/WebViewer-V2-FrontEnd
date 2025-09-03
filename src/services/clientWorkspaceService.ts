import { api } from './api';
import { Project, ClientProject, ClientAnalytics } from '../types';

interface ClientDashboardData {
    projectCount: number;
    activeProjects: Project[];
    recentActivity: ClientActivity[];
    accessStatistics: {
        totalSessions: number;
        avgSessionDuration: number;
        lastAccess: string | null;
        mostAccessedProject: string | null;
    };
    notifications: ClientNotification[];
}

interface ClientActivity {
    id: number;
    action: string;
    actionType: 'login' | 'project_view' | 'data_export' | 'feature_edit' | 'share';
    projectId?: number;
    projectName?: string;
    timestamp: string;
    duration?: number;
    details: Record<string, any>;
}

interface ClientNotification {
    id: number;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

interface ProjectFilters {
    search?: string;
    category?: string;
    status?: 'active' | 'inactive' | 'all';
    sortBy?: 'name' | 'lastAccessed' | 'created' | 'modified';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

interface ActivityFilters {
    dateRange?: [string, string];
    actionTypes?: string[];
    projectIds?: number[];
    limit?: number;
    offset?: number;
}

interface ClientProjectAccess {
    projectId: number;
    projectName: string;
    uniqueLink: string;
    permissions: {
        canView: boolean;
        canEdit: boolean;
        canExport: boolean;
        canShare: boolean;
        layerPermissions: Record<string, string[]>;
    };
    expiresAt: string | null;
    lastAccessed: string | null;
    accessCount: number;
    isActive: boolean;
}

interface ExportOptions {
    format: 'csv' | 'json' | 'pdf' | 'xlsx';
    projectId?: number;
    layerIds?: number[];
    dateRange?: [string, string];
    includeMetadata?: boolean;
    includeGeometry?: boolean;
}

interface ShareProjectRequest {
    projectId: number;
    shareType: 'link' | 'email';
    expiresAt?: string;
    permissions?: string[];
    recipientEmails?: string[];
    message?: string;
}

interface ShareProjectResponse {
    shareId: string;
    shareUrl: string;
    expiresAt: string | null;
    success: boolean;
}

interface CollaborationRequest {
    projectId: number;
    action: 'invite' | 'remove' | 'update_permissions';
    userId?: number;
    userEmail?: string;
    permissions?: string[];
}

interface ClientPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
        email: boolean;
        browser: boolean;
        projectUpdates: boolean;
        systemAlerts: boolean;
    };
    dashboard: {
        defaultView: 'grid' | 'list';
        itemsPerPage: number;
        showRecentActivity: boolean;
        showStatistics: boolean;
    };
}

class ClientWorkspaceService {
    private baseUrl = '/api/client-workspace';

    /**
     * Get dashboard data for the authenticated client user
     */
    async getDashboard(): Promise<ClientDashboardData> {
        try {
            const response = await api.get(`${this.baseUrl}/dashboard`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client dashboard:', error);
            // Return mock data for development
            return this.getMockDashboardData();
        }
    }

    /**
     * Get projects assigned to the client with optional filtering
     */
    async getProjects(filters: ProjectFilters = {}): Promise<{
        results: ClientProjectAccess[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const params = new URLSearchParams();
            
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);
            if (filters.sortBy) params.append('sort_by', filters.sortBy);
            if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.offset) params.append('offset', filters.offset.toString());

            const response = await api.get(`${this.baseUrl}/projects?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client projects:', error);
            return this.getMockProjectsData(filters);
        }
    }

    /**
     * Get a specific project by ID with client permissions
     */
    async getProject(id: string): Promise<ClientProjectAccess> {
        try {
            const response = await api.get(`${this.baseUrl}/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client project:', error);
            throw new Error('Failed to load project');
        }
    }

    /**
     * Get client activity history with optional filtering
     */
    async getActivity(filters: ActivityFilters = {}): Promise<{
        results: ClientActivity[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const params = new URLSearchParams();
            
            if (filters.dateRange) {
                params.append('start_date', filters.dateRange[0]);
                params.append('end_date', filters.dateRange[1]);
            }
            if (filters.actionTypes) {
                filters.actionTypes.forEach(type => params.append('action_types', type));
            }
            if (filters.projectIds) {
                filters.projectIds.forEach(id => params.append('project_ids', id.toString()));
            }
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.offset) params.append('offset', filters.offset.toString());

            const response = await api.get(`${this.baseUrl}/activity?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client activity:', error);
            return this.getMockActivityData(filters);
        }
    }

    /**
     * Update project access timestamp
     */
    async updateProjectAccess(projectId: number, lastAccessed: string = new Date().toISOString()): Promise<void> {
        try {
            await api.patch(`${this.baseUrl}/projects/${projectId}/access`, {
                last_accessed: lastAccessed
            });
        } catch (error) {
            console.error('Error updating project access:', error);
        }
    }

    /**
     * Export project data in various formats
     */
    async exportData(options: ExportOptions): Promise<Blob> {
        try {
            const params = new URLSearchParams();
            params.append('format', options.format);
            
            if (options.projectId) params.append('project_id', options.projectId.toString());
            if (options.layerIds) {
                options.layerIds.forEach(id => params.append('layer_ids', id.toString()));
            }
            if (options.dateRange) {
                params.append('start_date', options.dateRange[0]);
                params.append('end_date', options.dateRange[1]);
            }
            if (options.includeMetadata !== undefined) {
                params.append('include_metadata', options.includeMetadata.toString());
            }
            if (options.includeGeometry !== undefined) {
                params.append('include_geometry', options.includeGeometry.toString());
            }

            const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
                responseType: 'blob'
            });
            
            return response.data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw new Error('Failed to export data');
        }
    }

    /**
     * Share a project with others
     */
    async shareProject(request: ShareProjectRequest): Promise<ShareProjectResponse> {
        try {
            const response = await api.post(`${this.baseUrl}/projects/${request.projectId}/share`, request);
            return response.data;
        } catch (error) {
            console.error('Error sharing project:', error);
            throw new Error('Failed to share project');
        }
    }

    /**
     * Collaborate on a project
     */
    async collaborateOnProject(request: CollaborationRequest): Promise<{ success: boolean }> {
        try {
            const response = await api.post(`${this.baseUrl}/projects/${request.projectId}/collaborate`, request);
            return response.data;
        } catch (error) {
            console.error('Error collaborating on project:', error);
            throw new Error('Failed to collaborate on project');
        }
    }

    /**
     * Get client preferences
     */
    async getPreferences(): Promise<ClientPreferences> {
        try {
            const response = await api.get(`${this.baseUrl}/preferences`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client preferences:', error);
            return this.getDefaultPreferences();
        }
    }

    /**
     * Update client preferences
     */
    async updatePreferences(preferences: Partial<ClientPreferences>): Promise<ClientPreferences> {
        try {
            const response = await api.patch(`${this.baseUrl}/preferences`, preferences);
            return response.data;
        } catch (error) {
            console.error('Error updating client preferences:', error);
            throw new Error('Failed to update preferences');
        }
    }

    /**
     * Get client notifications
     */
    async getNotifications(): Promise<ClientNotification[]> {
        try {
            const response = await api.get(`${this.baseUrl}/notifications`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId: number): Promise<void> {
        try {
            await api.patch(`${this.baseUrl}/notifications/${notificationId}`, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    /**
     * Get client analytics
     */
    async getAnalytics(): Promise<ClientAnalytics> {
        try {
            const response = await api.get(`${this.baseUrl}/analytics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching client analytics:', error);
            throw new Error('Failed to load analytics');
        }
    }

    // Mock data methods for development
    private getMockDashboardData(): ClientDashboardData {
        return {
            projectCount: 8,
            activeProjects: [
                {
                    id: 1,
                    name: 'City Planning Project',
                    description: 'Urban development mapping',
                    thumbnail: '/api/placeholder/300/200',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-20T15:30:00Z'
                },
                {
                    id: 2,
                    name: 'Environmental Survey',
                    description: 'Wildlife habitat analysis',
                    thumbnail: '/api/placeholder/300/200',
                    created_at: '2024-01-10T09:00:00Z',
                    updated_at: '2024-01-18T11:15:00Z'
                }
            ] as Project[],
            recentActivity: [
                {
                    id: 1,
                    action: 'Viewed City Planning Project',
                    actionType: 'project_view',
                    projectId: 1,
                    projectName: 'City Planning Project',
                    timestamp: '2024-01-20T14:30:00Z',
                    duration: 25,
                    details: {}
                },
                {
                    id: 2,
                    action: 'Exported environmental data',
                    actionType: 'data_export',
                    projectId: 2,
                    projectName: 'Environmental Survey',
                    timestamp: '2024-01-19T16:45:00Z',
                    details: { format: 'csv', layers: ['vegetation', 'wildlife'] }
                }
            ],
            accessStatistics: {
                totalSessions: 47,
                avgSessionDuration: 23,
                lastAccess: '2024-01-20T14:30:00Z',
                mostAccessedProject: 'City Planning Project'
            },
            notifications: [
                {
                    id: 1,
                    type: 'info',
                    title: 'New Data Available',
                    message: 'Updated satellite imagery is now available for your projects',
                    timestamp: '2024-01-20T10:00:00Z',
                    read: false,
                    actionUrl: '/client/projects'
                }
            ]
        };
    }

    private getMockProjectsData(filters: ProjectFilters): Promise<{
        results: ClientProjectAccess[];
        total: number;
        hasMore: boolean;
    }> {
        const mockProjects: ClientProjectAccess[] = [
            {
                projectId: 1,
                projectName: 'City Planning Project',
                uniqueLink: 'https://app.example.com/client/project/abc123',
                permissions: {
                    canView: true,
                    canEdit: true,
                    canExport: true,
                    canShare: false,
                    layerPermissions: {
                        'buildings': ['view', 'edit'],
                        'roads': ['view'],
                        'zoning': ['view', 'edit', 'style']
                    }
                },
                expiresAt: '2024-06-30T23:59:59Z',
                lastAccessed: '2024-01-20T14:30:00Z',
                accessCount: 23,
                isActive: true
            },
            {
                projectId: 2,
                projectName: 'Environmental Survey',
                uniqueLink: 'https://app.example.com/client/project/def456',
                permissions: {
                    canView: true,
                    canEdit: false,
                    canExport: true,
                    canShare: false,
                    layerPermissions: {
                        'vegetation': ['view'],
                        'wildlife': ['view'],
                        'water_bodies': ['view']
                    }
                },
                expiresAt: null,
                lastAccessed: '2024-01-19T16:45:00Z',
                accessCount: 15,
                isActive: true
            }
        ];

        return Promise.resolve({
            results: mockProjects,
            total: mockProjects.length,
            hasMore: false
        });
    }

    private getMockActivityData(filters: ActivityFilters): Promise<{
        results: ClientActivity[];
        total: number;
        hasMore: boolean;
    }> {
        const mockActivities: ClientActivity[] = [
            {
                id: 1,
                action: 'Viewed City Planning Project',
                actionType: 'project_view',
                projectId: 1,
                projectName: 'City Planning Project',
                timestamp: '2024-01-20T14:30:00Z',
                duration: 25,
                details: { layers_viewed: ['buildings', 'roads'] }
            },
            {
                id: 2,
                action: 'Exported environmental data',
                actionType: 'data_export',
                projectId: 2,
                projectName: 'Environmental Survey',
                timestamp: '2024-01-19T16:45:00Z',
                details: { format: 'csv', layers: ['vegetation', 'wildlife'] }
            },
            {
                id: 3,
                action: 'Logged in to workspace',
                actionType: 'login',
                timestamp: '2024-01-19T09:15:00Z',
                details: { ip_address: '192.168.1.100' }
            }
        ];

        return Promise.resolve({
            results: mockActivities,
            total: mockActivities.length,
            hasMore: false
        });
    }

    private getDefaultPreferences(): ClientPreferences {
        return {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            notifications: {
                email: true,
                browser: true,
                projectUpdates: true,
                systemAlerts: true
            },
            dashboard: {
                defaultView: 'grid',
                itemsPerPage: 12,
                showRecentActivity: true,
                showStatistics: true
            }
        };
    }
}

// Export singleton instance
export const clientWorkspaceService = new ClientWorkspaceService();

// Export types for use in components
export type {
    ClientDashboardData,
    ClientActivity,
    ClientNotification,
    ProjectFilters,
    ActivityFilters,
    ClientProjectAccess,
    ExportOptions,
    ShareProjectRequest,
    ShareProjectResponse,
    CollaborationRequest,
    ClientPreferences
};