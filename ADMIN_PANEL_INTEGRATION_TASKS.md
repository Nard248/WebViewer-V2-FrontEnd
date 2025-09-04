# Admin Panel Integration Tasks

## Overview
This document outlines the tasks required to fully integrate the admin panel with the new backend API endpoints. The backend provides comprehensive CRUD operations for project management, layer configuration, and client access control.

## Prerequisites
- Review the existing `ProjectDetailPage.tsx` and `ProjectViewerPage.tsx` components
- Familiarize yourself with the `adminProjectService.ts` service structure
- Ensure authentication tokens are properly configured for admin endpoints

---

## 🔴 Priority 1: Core API Integration

### Task 1.1: Extend Admin Project Service
**Location:** `src/services/adminProjectService.ts`

- Add API methods for all CRUD operations (create, update, delete projects)
- Implement layer group management functions (create, update, delete, reorder)
- Add layer management functions within groups
- Include project configuration endpoints (spatial settings, map controls)
- Implement client assignment management functions

### Task 1.2: Add API Error Handling
**Location:** `src/services/api.ts` and `adminProjectService.ts`

- Implement proper error handling for all admin endpoints
- Add retry logic for failed requests
- Create standardized error messages for user feedback
- Handle 401/403 authentication errors appropriately

---

## 🟡 Priority 2: UI Functionality Implementation

### Task 2.1: Complete Project Edit Mode
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx`

- Connect edit mode save functionality to PUT `/admin/projects/{id}/` endpoint
- Implement field validation before saving
- Add loading states during save operations
- Show success/error notifications after save attempts

### Task 2.2: Implement Layer Group Management
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx` (Layers & Groups Tab)

- Connect "Add Layer Group" button to POST endpoint
- Implement drag-and-drop reordering with `/groups/reorder/` endpoint
- Add edit functionality for existing groups
- Connect delete confirmations to DELETE endpoints
- Update UI after successful operations

### Task 2.3: Implement Layer Operations
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx` (Layers & Groups Tab)

- Add create layer functionality within groups
- Implement layer editing (connect to PUT endpoint)
- Add move layer between groups functionality
- Implement layer reordering within groups
- Connect delete operations to backend

### Task 2.4: Client Assignment Management
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx` (Client Access Tab)

- Implement "Assign Client" dialog with client selection
- Connect to client assignment endpoints
- Add remove client functionality
- Display and manage user access within client assignments
- Implement access link generation and copying

---

## 🟢 Priority 3: Enhanced Features

### Task 3.1: Add Create Project Flow
**Location:** Create new component `src/pages/admin/project-viewer/ProjectCreatePage.tsx`

- Build project creation form with all required fields
- Implement state selection dropdown
- Add project type selection
- Connect to POST `/admin/projects/create/` endpoint
- Navigate to detail page after successful creation

### Task 3.2: Implement Map Configuration
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx` (Map Settings Tab)

- Connect map settings to PATCH `/admin/projects/{id}/config/` endpoint
- Add map preview showing current center/zoom settings
- Implement map control toggles configuration
- Add validation for lat/lng and zoom values

### Task 3.3: Add Project Cloning
**Location:** `src/pages/admin/project-viewer/ProjectDetailPage.tsx`

- Add "Clone Project" button to action bar
- Create clone confirmation dialog
- Connect to POST `/admin/projects/{id}/clone/` endpoint
- Navigate to cloned project after success

### Task 3.4: Implement Bulk Operations
**Location:** `src/pages/admin/project-viewer/ProjectViewerPage.tsx`

- Add checkbox selection for project cards
- Implement bulk delete functionality
- Add bulk status change (activate/deactivate)
- Create bulk assignment operations

---

## 🔵 Priority 4: Data Management & Optimization

### Task 4.1: Add Layer Data Viewer
**Location:** Create new component within Layers tab

- Implement paginated data table for layer features
- Add "Clear Data" functionality with confirmation
- Display feature count and data statistics
- Add data export functionality (if needed)

### Task 4.2: Implement Search and Filters
**Location:** `src/pages/admin/project-viewer/ProjectViewerPage.tsx`

- Connect existing filters to API query parameters
- Add debouncing to search input
- Implement filter persistence in URL params
- Add clear all filters functionality

### Task 4.3: Add Loading Skeletons
**Location:** All admin panel pages

- Replace loading spinners with skeleton components
- Add shimmer effects for better UX
- Implement progressive loading for large datasets

---

## ⚪ Priority 5: Polish & Testing

### Task 5.1: Add Keyboard Shortcuts
- Implement ESC to close dialogs
- Add CTRL+S to save in edit mode
- Add keyboard navigation for tabs

### Task 5.2: Improve Responsive Design
- Test and fix mobile layouts
- Ensure dialogs work on small screens
- Make tables horizontally scrollable on mobile

### Task 5.3: Add Confirmation Dialogs
- Ensure all destructive actions have confirmations
- Add "unsaved changes" warnings when navigating away
- Implement undo functionality for critical operations

---

## 📋 Testing Checklist

### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] Filters and pagination function properly
- [ ] Drag-and-drop reordering saves correctly
- [ ] Client assignments update in real-time
- [ ] Map configuration changes persist

### Error Handling
- [ ] Network errors show appropriate messages
- [ ] Validation errors are clearly displayed
- [ ] 404 errors handled gracefully
- [ ] Session expiry redirects to login

### Performance
- [ ] Large project lists load efficiently
- [ ] Pagination prevents memory issues
- [ ] API calls are properly debounced
- [ ] Unnecessary re-renders are minimized

---

## 📝 Notes for Developers

1. **State Management**: Consider using React Query or SWR for API state management and caching
2. **Type Safety**: Ensure all API responses have corresponding TypeScript interfaces
3. **Optimistic Updates**: Implement optimistic UI updates for better perceived performance
4. **Accessibility**: Ensure all interactive elements are keyboard accessible
5. **Documentation**: Update component documentation as features are added

## 🚀 Deployment Considerations

- Ensure environment variables for API endpoints are configured
- Test with production-like data volumes
- Verify admin authentication flows
- Check CORS settings for API calls
- Monitor API response times and optimize if needed

---