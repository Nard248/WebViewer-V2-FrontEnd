// src/services/clientService.ts
import { apiGet, apiPost, apiPut, apiDelete, createQueryParams } from './api';
import {
    Client,
    ClientCreate,
    ClientUpdate,
    ClientProject,
    ClientProjectCreate,
    ClientAccessResponse,
    BatchAssignRequest,
    BatchAssignResponse,
    ClientAnalytics
} from '../types';
import { User } from '../types';
import { PaginatedResponse } from '../types';
import { UserCreate, UserUpdate } from '../types/client-users.types';

/**
 * Get clients with pagination and filtering
 */
export const getClients = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<Client>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<Client>>(`/clients/?${queryParams.toString()}`);
};

/**
 * Get a single client by ID
 */
export const getClient = (id: number): Promise<Client> => {
    return apiGet<Client>(`/clients/${id}/`);
};

/**
 * Create a new client
 */
export const createClient = (client: ClientCreate): Promise<Client> => {
    return apiPost<Client>('/clients/', client);
};

/**
 * Update a client
 */
export const updateClient = (id: number, client: ClientUpdate): Promise<Client> => {
    return apiPut<Client>(`/clients/${id}/`, client);
};

/**
 * Delete a client
 */
export const deleteClient = (id: number): Promise<void> => {
    return apiDelete<void>(`/clients/${id}/`);
};

/**
 * Get client users
 */
export const getClientUsers = (id: number): Promise<User[]> => {
    return apiGet<User[]>(`/clients/${id}/users/`);
};

// TODO: Create Backend Code to handle POST, PUT, DELETE
/**
 * Create a new client user
 */
export const createClientUser = (clientId: number, data: UserCreate): Promise<User> => {
    return apiPost<User>(`/clients/${clientId}/add_user/`, data);
  };  

/**
 * Update a client user
 */
export const updateClientUser = (clientId: number, userId: number, data: UserUpdate): Promise<User> => {
  return apiPut<User>(`/clients/${clientId}/users/${userId}/`, data);
};

/**
 * Delete a client user
 */
export const deleteClientUser = (clientId: number, userId: number): Promise<void> => {
  return apiDelete<void>(`/clients/${clientId}/users/${userId}/`);
};


/**
 * Get client projects
 */
export const getClientProjects = (id: number): Promise<ClientProject[]> => {
    return apiGet<ClientProject[]>(`/clients/${id}/projects/`);
};

/**
 * Get client analytics
 */
export const getClientAnalytics = (id: number): Promise<ClientAnalytics> => {
    return apiGet<ClientAnalytics>(`/clients/${id}/analytics/`);
};

/**
 * Get client projects with pagination and filtering
 */
export const getClientProjectAssociations = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<ClientProject>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<ClientProject>>(
        `/client-projects/?${queryParams.toString()}`
    );
};

/**
 * Create client project association
 */
export const createClientProject = (
    clientProject: ClientProjectCreate
): Promise<ClientProject> => {
    return apiPost<ClientProject>('/client-projects/', clientProject);
};

/**
 * Record client access
 */
export const recordClientAccess = (id: number): Promise<ClientAccessResponse> => {
    return apiPost<ClientAccessResponse>(`/client-projects/${id}/record_access/`);
};

/**
 * Batch assign projects to client
 */
export const batchAssignProjects = (
    request: BatchAssignRequest
): Promise<BatchAssignResponse> => {
    return apiPost<BatchAssignResponse>('/client-projects/batch_assign/', request);
};

const clientService = {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    getClientUsers,
    getClientProjects,
    getClientAnalytics,
    getClientProjectAssociations,
    createClientProject,
    recordClientAccess,
    batchAssignProjects
};

export default clientService;