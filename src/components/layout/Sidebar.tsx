// src/components/layout/Sidebar.tsx
import React from 'react';
import {
    Drawer as MuiDrawer,
    List,
    Divider,
    IconButton,
    styled,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Box,
    Tooltip,
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Map as MapIcon,
    Layers as LayersIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    ExpandLess,
    ExpandMore,
    Public as PublicIcon,
    Storage as StorageIcon,
    ColorLens as ColorLensIcon,
    Equalizer as EqualizerIcon,
    AdminPanelSettings as AdminIcon,
    Security as SecurityIcon,
    Link as LinkIcon,
    Category as CategoryIcon,
    Palette as PaletteIcon,
    Build as BuildIcon,
    Functions as FunctionsIcon,
    Radio as CBRSIcon,
    History as AuditIcon,
    LocationOn as FCCIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Extension as ExtensionIcon,
    Code as CodeIcon,
    Room as RoomIcon,
    WebAsset as WebAssetIcon,
} from '@mui/icons-material';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    drawerWidth: number;
}

interface NavItem {
    title: string;
    path: string;
    icon: React.ReactNode;
    children?: NavItem[];
    adminOnly?: boolean;
}

const openedMixin = (theme: any, drawerWidth: number) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: any) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth' })(
    ({ theme, open, drawerWidth }: any) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme, drawerWidth),
            '& .MuiDrawer-paper': openedMixin(theme, drawerWidth),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, drawerWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    const handleToggleMenu = (title: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const isAdmin = user?.is_admin;

    const navItems: NavItem[] = [
        {
            title: 'Dashboard',
            path: '/dashboard',
            icon: <DashboardIcon />
        },
        {
            title: 'Projects',
            path: '/projects',
            icon: <MapIcon />,
            children: [
                { title: 'All Projects', path: '/projects', icon: <PublicIcon /> },
                { title: 'Create Project', path: '/projects/create', icon: <PublicIcon /> },
            ]
        },
        {
            title: 'Map Data',
            path: '/layers',
            icon: <LayersIcon />,
            children: [
                { title: 'Layers', path: '/layers', icon: <LayersIcon /> },
                { title: 'Basemaps', path: '/basemaps', icon: <PublicIcon /> },
                { title: 'Styles', path: '/styles', icon: <ColorLensIcon /> },
                { title: 'Data Sources', path: '/datasources', icon: <StorageIcon /> },
            ]
        },
        {
            title: 'Components',
            path: '/components',
            icon: <ExtensionIcon />,
            children: [
                { title: 'Styles', path: '/components/styles', icon: <ColorLensIcon /> },
                { title: 'Functions', path: '/components/functions', icon: <CodeIcon /> },
                { title: 'Markers', path: '/components/markers', icon: <RoomIcon /> },
                { title: 'Popup Templates', path: '/components/popups', icon: <WebAssetIcon /> },
                { title: 'Basemaps', path: '/components/basemaps', icon: <MapIcon /> },
            ]
        },
        {
            title: 'Analytics',
            path: '/analytics',
            icon: <EqualizerIcon />
        },
        {
            title: 'Clients',
            path: '/clients',
            icon: <PeopleIcon />,
            adminOnly: true
        },
        {
            title: 'Admin',
            path: '/admin',
            icon: <AdminIcon />,
            adminOnly: true,
            children: [
                { title: 'Layer Types', path: '/admin/layer-types', icon: <CategoryIcon /> },
                { title: 'Permissions', path: '/admin/permissions', icon: <SecurityIcon /> },
                { title: 'Client Projects', path: '/admin/client-projects', icon: <LinkIcon /> },
                { title: 'Color Palettes', path: '/admin/color-palettes', icon: <PaletteIcon /> },
                { title: 'Map Tools', path: '/admin/map-tools', icon: <BuildIcon /> },
                { title: 'Layer Functions', path: '/admin/layer-functions', icon: <FunctionsIcon /> },
                { title: 'CBRS Licenses', path: '/admin/cbrs-licenses', icon: <CBRSIcon /> },
                { title: 'Audit Logs', path: '/admin/audit-logs', icon: <AuditIcon /> },
                { title: 'FCC Locations', path: '/admin/fcc-locations', icon: <FCCIcon /> },
            ]
        },
        {
            title: 'Settings',
            path: '/settings',
            icon: <SettingsIcon />
        },
    ];

    const renderNavItems = (items: NavItem[]) => {
        return items.map((item) => {
            // Skip admin-only items for non-admin users
            if (item.adminOnly && !isAdmin) {
                return null;
            }

            const isSelected = location.pathname === item.path;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus[item.title];

            return (
                <React.Fragment key={item.title}>
                    <ListItemButton
                        onClick={() => hasChildren ? handleToggleMenu(item.title) : handleNavigate(item.path)}
                        selected={isSelected}
                        sx={{
                            minHeight: 48,
                            justifyContent: open ? 'initial' : 'center',
                            px: 2.5,
                        }}
                    >
                        <Tooltip title={open ? '' : item.title} placement="right">
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
                                    justifyContent: 'center',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                        </Tooltip>
                        <ListItemText
                            primary={item.title}
                            sx={{ opacity: open ? 1 : 0 }}
                        />
                        {hasChildren && open && (
                            isExpanded ? <ExpandLess /> : <ExpandMore />
                        )}
                    </ListItemButton>

                    {hasChildren && (
                        <Collapse in={open && isExpanded} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {item.children!.map((child) => {
                                    const isChildSelected = location.pathname === child.path;

                                    return (
                                        <ListItemButton
                                            key={child.title}
                                            selected={isChildSelected}
                                            onClick={() => handleNavigate(child.path)}
                                            sx={{ pl: 4 }}
                                        >
                                            <ListItemIcon>{child.icon}</ListItemIcon>
                                            <ListItemText primary={child.title} />
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Collapse>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <Drawer
            variant="permanent"
            open={open}
            drawerWidth={drawerWidth}
        >
            <DrawerHeader>
                <IconButton onClick={onClose}>
                    <ChevronLeftIcon />
                </IconButton>
            </DrawerHeader>
            <Divider />
            <List>
                {renderNavItems(navItems)}
            </List>
        </Drawer>
    );
};