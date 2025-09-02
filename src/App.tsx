// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MapProvider } from './context/MapContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Layouts
import { MainLayout } from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Projects
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectCreatePage from './pages/projects/ProjectCreatePage';
import ProjectEditPage from './pages/projects/ProjectEditPage';
import ProjectViewPage from './pages/projects/ProjectViewPage';

// Layers
import LayersPage from './pages/layers/LayersPage';
import LayerCreatePage from './pages/layers/LayerCreatePage';
import LayerEditPage from './pages/layers/LayerEditPage';

// Clients (for admin users)
import ClientsPage from './pages/clients/ClientsPage';
import ClientCreatePage from './pages/clients/ClientCreatePage';
import ClientEditPage from './pages/clients/ClientEditPage';
import UsersPage from './pages/clients/users/UsersPage.tsx';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Other Pages
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Standalone Viewer
import StandaloneViewerPage from './pages/viewer/StandaloneViewerPage';
import StandaloneViewerPageDev from './pages/viewer-dev/StandaloneViewerPageDev';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';

// Component Page
import StylesPage from './pages/components/StylesPage'
import StyleCreatePage from "./pages/components/StyleCreatePage.tsx";
import StyleEditPage from './pages/components/StyleEditPage.tsx';

import FunctionsPage from './pages/components/FunctionsPage.tsx';
import FunctionCreatePage from './pages/components/FunctionCreatePage.tsx';
import FunctionCodePage from './pages/components/FunctionCodePage.tsx';
import FunctionEditPage from "./pages/components/FunctionEditPage.tsx";
import MarkersPage from './pages/components/MarkersPage.tsx';
import MarkerCreatePage from './pages/components/MarkerCreatePage.tsx';
import MarkerEditPage from "./pages/components/MarkerEditPage.tsx";
import PopupTemplatesPage from './pages/components/PopupTemplatesPage';
import PopupTemplateCreatePage from './pages/components/PopupTemplateCreatePage';
import PopupTemplateEditPage from './pages/components/PopupTemplateEditPage';
import BasemapsPage from './pages/components/BasemapsPage';
import BasemapCreatePage from './pages/components/BasemapCreatePage';
import BasemapEditPage from './pages/components/BasemapEditPage';

// Admin Pages
import LayerTypesPage from './pages/admin/layer-types/LayerTypesPage';
import LayerTypeCreatePage from './pages/admin/layer-types/LayerTypeCreatePage';
import LayerTypeEditPage from './pages/admin/layer-types/LayerTypeEditPage';
import LayerPermissionsPage from './pages/admin/permissions/LayerPermissionsPage';
import ClientProjectsPage from './pages/admin/associations/ClientProjectsPage';
import ColorPalettesPage from './pages/admin/color-palettes/ColorPalettesPage';
import ColorPaletteEditor from './pages/admin/color-palettes/ColorPaletteEditor';
import MapToolsPage from './pages/admin/map-tools/MapToolsPage';
import MapToolCreatePage from './pages/admin/map-tools/MapToolCreatePage';
import ProjectLayerFunctionsPage from './pages/admin/layer-functions/ProjectLayerFunctionsPage';
import CBRSLicensesPage from './pages/admin/cbrs/CBRSLicensesPage';
import AuditLogsPage from './pages/admin/audit/AuditLogsPage';
import FCCLocationsPage from './pages/admin/fcc/FCCLocationsPage';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import ApiInspectorPage from './pages/debug/ApiInspectorPage';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Auth Routes - No protection needed */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/:token/:uidb64" element={<ResetPasswordPage />} />

                        {/* Standalone Viewer Routes */}
                        <Route path="/public-viewer/:hash" element={<StandaloneViewerPage />} />
                        <Route path="/viewer/:id" element={<ProtectedRoute component={StandaloneViewerPage} />} />
                        <Route path="/public-viewer-dev/:hash" element={<StandaloneViewerPageDev />} />
                        <Route path="/viewer-dev/:id" element={<ProtectedRoute component={StandaloneViewerPageDev} />} />

                        {/* Protected Routes with Main Layout */}
                        <Route path="/" element={<ProtectedRoute component={MainLayout} />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />

                            {/* Dashboard */}
                            <Route path="dashboard" element={<DashboardPage />} />

                            {/* Projects */}
                            <Route path="projects" element={<ProjectsPage />} />
                            <Route path="projects/create" element={<ProjectCreatePage />} />
                            <Route path="projects/:id/edit" element={<ProjectEditPage />} />
                            <Route
                                path="projects/:id/view"
                                element={
                                    <MapProvider>
                                        <ProjectViewPage />
                                    </MapProvider>
                                }
                            />

                            {/* Layers */}
                            <Route path="layers" element={<LayersPage />} />
                            <Route path="layers/create" element={<LayerCreatePage />} />
                            <Route path="layers/:id/edit" element={<LayerEditPage />} />

                            {/* Clients - Admin Only */}
                            <Route path="clients" element={<ProtectedRoute component={ClientsPage} adminOnly={true} />} />
                            <Route path="clients/create" element={<ProtectedRoute component={ClientCreatePage} adminOnly={true} />} />
                            <Route path="clients/:id/edit" element={<ProtectedRoute component={ClientEditPage} adminOnly={true} />} />
                            <Route path="clients/:id/users" element={<ProtectedRoute component={UsersPage} adminOnly={true} />} />

                            {/* Settings */}
                            <Route path="settings" element={<SettingsPage />} />

                            {/* Analytics */}
                            <Route path="analytics" element={<AnalyticsPage />} />

                            {/* User Profile */}
                            <Route path="profile" element={<ProfilePage />} />

                            {/* Components */}
                            <Route path="components/styles" element={<StylesPage />} />
                            <Route path="components/styles/create" element={<StyleCreatePage />} />
                            <Route path="components/styles/:id/edit" element={<StyleEditPage />} />

                            <Route path="components/functions" element={<FunctionsPage />} />
                            <Route path="components/functions/create" element={<FunctionCreatePage />} />
                            <Route path="components/functions/:id/edit" element={<FunctionEditPage />} />
                            <Route path="components/functions/:id/code" element={<FunctionCodePage />} />

                            <Route path="components/markers" element={<MarkersPage />} />
                            <Route path="components/markers/create" element={<MarkerCreatePage />} />
                            <Route path="components/markers/:id/edit" element={<MarkerEditPage />} />

                            <Route path="components/popups" element={<PopupTemplatesPage />} />
                            <Route path="components/popups/create" element={<PopupTemplateCreatePage />} />
                            <Route path="components/popups/:id/edit" element={<PopupTemplateEditPage />} />

                            <Route path="components/basemaps" element={<BasemapsPage />} />
                            <Route path="components/basemaps/create" element={<BasemapCreatePage />} />
                            <Route path="components/basemaps/:id/edit" element={<BasemapEditPage />} />

                            {/* Admin Routes - Admin Only */}
                            <Route path="admin/layer-types" element={<ProtectedRoute component={LayerTypesPage} adminOnly={true} />} />
                            <Route path="admin/layer-types/create" element={<ProtectedRoute component={LayerTypeCreatePage} adminOnly={true} />} />
                            <Route path="admin/layer-types/:id/edit" element={<ProtectedRoute component={LayerTypeEditPage} adminOnly={true} />} />
                            <Route path="admin/permissions" element={<ProtectedRoute component={LayerPermissionsPage} adminOnly={true} />} />
                            <Route path="admin/client-projects" element={<ProtectedRoute component={ClientProjectsPage} adminOnly={true} />} />
                            <Route path="admin/color-palettes" element={<ProtectedRoute component={ColorPalettesPage} adminOnly={true} />} />
                            <Route path="admin/color-palettes/create" element={<ProtectedRoute component={ColorPaletteEditor} adminOnly={true} />} />
                            <Route path="admin/color-palettes/:id/edit" element={<ProtectedRoute component={ColorPaletteEditor} adminOnly={true} />} />
                            <Route path="admin/map-tools" element={<ProtectedRoute component={MapToolsPage} adminOnly={true} />} />
                            <Route path="admin/map-tools/create" element={<ProtectedRoute component={MapToolCreatePage} adminOnly={true} />} />
                            <Route path="admin/layer-functions" element={<ProtectedRoute component={ProjectLayerFunctionsPage} adminOnly={true} />} />
                            <Route path="admin/cbrs-licenses" element={<ProtectedRoute component={CBRSLicensesPage} adminOnly={true} />} />
                            <Route path="admin/audit-logs" element={<ProtectedRoute component={AuditLogsPage} adminOnly={true} />} />
                            <Route path="admin/fcc-locations" element={<ProtectedRoute component={FCCLocationsPage} adminOnly={true} />} />

                            <Route path="debug/api-inspector" element={<ApiInspectorPage />} />

                            {/* Catch-all route */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;