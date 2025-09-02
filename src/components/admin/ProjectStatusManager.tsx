// src/components/admin/ProjectStatusManager.tsx
import React, { useState } from 'react';
import {
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Tooltip,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as DraftIcon,
    PlayArrow as ActiveIcon,
    Pause as PausedIcon,
    Archive as ArchivedIcon,
    Lock as LockedIcon,
    Public as PublicIcon,
    VisibilityOff as PrivateIcon,
} from '@mui/icons-material';
import { updateProject } from '../../services/projectService';
import { Project } from '../../types/project.types';

export interface ProjectStatus {
    is_active: boolean;
    is_public: boolean;
    status_label: 'Draft' | 'Active' | 'Paused' | 'Archived';
    description?: string;
}

interface ProjectStatusManagerProps {
    project: Project;
    onStatusChange?: (project: Project) => void;
    showActions?: boolean;
}

const PROJECT_STATUSES = {
    draft: {
        label: 'Draft' as const,
        color: 'default' as const,
        icon: DraftIcon,
        description: 'Project is in development',
        is_active: false,
        is_public: false,
    },
    active: {
        label: 'Active' as const,
        color: 'success' as const,
        icon: ActiveIcon,
        description: 'Project is live and accessible',
        is_active: true,
        is_public: false,
    },
    public: {
        label: 'Public' as const,
        color: 'info' as const,
        icon: PublicIcon,
        description: 'Project is public and accessible to everyone',
        is_active: true,
        is_public: true,
    },
    paused: {
        label: 'Paused' as const,
        color: 'warning' as const,
        icon: PausedIcon,
        description: 'Project is temporarily inactive',
        is_active: false,
        is_public: false,
    },
    archived: {
        label: 'Archived' as const,
        color: 'default' as const,
        icon: ArchivedIcon,
        description: 'Project is archived and read-only',
        is_active: false,
        is_public: false,
    },
};

const ProjectStatusManager: React.FC<ProjectStatusManagerProps> = ({
    project,
    onStatusChange,
    showActions = true,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        status?: keyof typeof PROJECT_STATUSES;
        title: string;
        message: string;
    }>({ open: false, title: '', message: '' });
    const [loading, setLoading] = useState(false);

    const getCurrentStatus = (): keyof typeof PROJECT_STATUSES => {
        if (project.is_public && project.is_active) return 'public';
        if (project.is_active) return 'active';
        // For now, we'll treat inactive projects as paused
        // In a full implementation, you'd need additional fields to distinguish
        return 'paused';
    };

    const currentStatus = getCurrentStatus();
    const statusConfig = PROJECT_STATUSES[currentStatus];
    const StatusIcon = statusConfig.icon;

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleStatusChange = (newStatus: keyof typeof PROJECT_STATUSES) => {
        const config = PROJECT_STATUSES[newStatus];
        
        // Show confirmation for certain status changes
        if (newStatus === 'archived') {
            setConfirmDialog({
                open: true,
                status: newStatus,
                title: 'Archive Project',
                message: 'Archiving this project will make it read-only and hide it from active projects. This action can be reversed.',
            });
        } else if (newStatus === 'public') {
            setConfirmDialog({
                open: true,
                status: newStatus,
                title: 'Make Project Public',
                message: 'Making this project public will allow anyone with the public link to view it. Are you sure?',
            });
        } else {
            updateProjectStatus(config.is_active, config.is_public);
        }
        
        handleMenuClose();
    };

    const handleConfirmStatusChange = () => {
        if (confirmDialog.status) {
            const config = PROJECT_STATUSES[confirmDialog.status];
            updateProjectStatus(config.is_active, config.is_public);
        }
        setConfirmDialog({ open: false, title: '', message: '' });
    };

    const updateProjectStatus = async (isActive: boolean, isPublic: boolean) => {
        setLoading(true);
        
        try {
            const updatedProject = await updateProject(project.id, {
                is_active: isActive,
                is_public: isPublic,
            });
            
            onStatusChange?.(updatedProject);
        } catch (error) {
            console.error('Error updating project status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={statusConfig.description}>
                <Chip
                    icon={<StatusIcon />}
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                    variant="filled"
                />
            </Tooltip>
            
            {project.is_public && (
                <Tooltip title="Publicly accessible">
                    <PublicIcon color="info" fontSize="small" />
                </Tooltip>
            )}
            
            {!project.is_public && (
                <Tooltip title="Private project">
                    <PrivateIcon color="action" fontSize="small" />
                </Tooltip>
            )}

            {showActions && (
                <>
                    <IconButton
                        size="small"
                        onClick={handleMenuClick}
                        disabled={loading}
                    >
                        <MoreVertIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        {Object.entries(PROJECT_STATUSES).map(([key, config]) => {
                            const Icon = config.icon;
                            const isCurrentStatus = key === currentStatus;
                            
                            return (
                                <MenuItem
                                    key={key}
                                    onClick={() => handleStatusChange(key as keyof typeof PROJECT_STATUSES)}
                                    disabled={isCurrentStatus}
                                >
                                    <ListItemIcon>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography variant="body2">
                                            {config.label}
                                            {isCurrentStatus && ' (Current)'}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {config.description}
                                        </Typography>
                                    </ListItemText>
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, title: '', message: '' })}
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDialog({ open: false, title: '', message: '' })}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmStatusChange}
                        color="primary"
                        variant="contained"
                        disabled={loading}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectStatusManager;