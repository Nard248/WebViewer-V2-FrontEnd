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

// Settings
import SettingsPage from './pages/settings/SettingsPage';

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Other Pages
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Standalone Viewer
import StandaloneViewerPage from './pages/viewer/StandaloneViewerPage';

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

                        {/* Standalone Viewer Route - Protected but with special layout */}
                        <Route path="/viewer/:id" element={<ProtectedRoute component={StandaloneViewerPage} />} />

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