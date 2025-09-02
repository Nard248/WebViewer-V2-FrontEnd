// src/services/styleService.ts
import { apiGet, apiPost, apiPut, apiDelete, createQueryParams } from './api';
import {
    Style,
    StyleCreate,
    StyleUpdate,
    StyleApplyResponse,
    StyleCategorizedRequest,
    StyleCategorizedResponse,
    ColorPalette,
    ColorPaletteCreate
} from '../types';
import { PaginatedResponse } from '../types';

/**
 * Get styles with pagination and filtering
 */
export const getStyles = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<Style>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<Style>>(`/styles/?${queryParams.toString()}`);
};

/**
 * Get a single style by ID
 */
export const getStyle = (id: number): Promise<Style> => {
    return apiGet<Style>(`/styles/${id}/`);
};

/**
 * Create a new style
 */
export const createStyle = (style: StyleCreate): Promise<Style> => {
    return apiPost<Style>('/styles/', style);
};

/**
 * Update a style
 */
export const updateStyle = (id: number, style: StyleUpdate): Promise<Style> => {
    return apiPut<Style>(`/styles/${id}/`, style);
};

/**
 * Delete a style
 */
export const deleteStyle = (id: number): Promise<void> => {
    return apiDelete<void>(`/styles/${id}/`);
};

/**
 * Apply style to layer
 */
export const applyStyleToLayer = (
    styleId: number,
    layerId: number
): Promise<StyleApplyResponse> => {
    return apiPost<StyleApplyResponse>(
        `/styles/${styleId}/apply_to_layer/`,
        { layer_id: layerId }
    );
};

/**
 * Generate categorized style
 */
export const generateCategorizedStyle = (
    styleId: number,
    request: StyleCategorizedRequest
): Promise<StyleCategorizedResponse> => {
    return apiPost<StyleCategorizedResponse>(
        `/styles/${styleId}/generate_categorized/`,
        request
    );
};

/**
 * Get color palettes with pagination and filtering
 */
export const getColorPalettes = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<ColorPalette>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<ColorPalette>>(`/color-palettes/?${queryParams.toString()}`);
};

/**
 * Get a single color palette by ID
 */
export const getColorPalette = (id: number): Promise<ColorPalette> => {
    return apiGet<ColorPalette>(`/color-palettes/${id}/`);
};

/**
 * Create a new color palette
 */
export const createColorPalette = (palette: ColorPaletteCreate): Promise<ColorPalette> => {
    return apiPost<ColorPalette>('/color-palettes/', palette);
};

/**
 * Update a color palette
 */
export const updateColorPalette = (id: number, palette: Partial<ColorPaletteCreate>): Promise<ColorPalette> => {
    return apiPut<ColorPalette>(`/color-palettes/${id}/`, palette);
};

/**
 * Delete a color palette
 */
export const deleteColorPalette = (id: number): Promise<void> => {
    return apiDelete<void>(`/color-palettes/${id}/`);
};

const styleService = {
    getStyles,
    getStyle,
    createStyle,
    updateStyle,
    deleteStyle,
    applyStyleToLayer,
    generateCategorizedStyle,
    getColorPalettes,
    getColorPalette,
    createColorPalette,
    deleteColorPalette
};

export default styleService;