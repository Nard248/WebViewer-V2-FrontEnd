import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardActions,
    CardMedia,
    Button,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Pagination,
    Tooltip,
    Avatar,
    AvatarGroup
} from '@mui/material';
import { 
    Map as MapIcon,
    Settings as SettingsIcon,
    FilterList as FilterIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    People as PeopleIcon,
    Layers as LayersIcon,
    Dataset as DatasetIcon,
    Public as PublicIcon,
    Lock as PrivateIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Category as TypeIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { 
    getAdminProjects, 
    AdminProjectCard, 
    AdminProjectFilters,
    AdminProjectsPaginatedResponse 
} from '../../../services/adminProjectService';
import { format } from 'date-fns';
import MapLoadingAnimation from '../../../components/ui/MapLoadingAnimation';

const ProjectViewerPage: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<AdminProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next: false,
        has_previous: false
    });
    
    // Filter states - now functional
    const [filters, setFilters] = useState<AdminProjectFilters>({
        ordering: '-updated_at'
    });
    const [statusFilter, setStatusFilter] = useState('');
    const [publicFilter, setPublicFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [pagination.page, filters]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await getAdminProjects(filters, pagination.page, pagination.page_size);
            setProjects(response.results);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleConfigure = (project: AdminProjectCard) => {
        navigate(`/admin/project-viewer/${project.id}`);
    };

    const handleFilterChange = (newFilters: Partial<AdminProjectFilters>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPagination(prev => ({ ...prev, page: value }));
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const getProjectTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'test-maps': return 'primary';
            case 'production': return 'success';
            case 'development': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ 
            width: '100%', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: { xs: 2, sm: 3 }, // Add padding for mobile
            py: 2
        }}>
            {/* Page Header */}
            <Box sx={{ 
                mb: 4, 
                textAlign: 'center',
                maxWidth: '1400px',
                width: '100%'
            }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                    Project Viewer
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage and view all projects in the system
                </Typography>
            </Box>

            {/* Filters Section */}
            <Paper sx={{ 
                p: 4, 
                mb: 4,
                width: '100%',
                maxWidth: '1400px', // Match the card grid max width
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 25%, #4caf50 50%, #ff9800 75%, #f44336 100%)',
                    },
                    '&:hover': {
                        boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                        transform: 'translateY(-2px)',
                    }
                }}>
                    {/* Header Section */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        mb: 3,
                        pb: 2,
                        borderBottom: '2px solid',
                        borderColor: 'divider'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }}>
                                <FilterIcon sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    Project Filters
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Refine your search with advanced filtering options
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            border: '1px solid rgba(33, 150, 243, 0.2)'
                        }}>
                            <DatasetIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {pagination.total_count}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                projects found
                            </Typography>
                        </Box>
                    </Box>

                    {/* Filter Controls */}
                    <Grid container spacing={3}>
                        {/* Search by State */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Box sx={{ position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ 
                                    mb: 1, 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <LocationIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                    Search by State
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={stateFilter}
                                    onChange={(e) => {
                                        setStateFilter(e.target.value);
                                        handleFilterChange({ state: e.target.value || undefined });
                                    }}
                                    placeholder="Enter state name or abbreviation..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: '56px',
                                            backgroundColor: 'rgba(76, 175, 80, 0.02)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'success.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'success.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Project Type */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Box sx={{ position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ 
                                    mb: 1, 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <TypeIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                                    Project Type
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={typeFilter}
                                        onChange={(e) => {
                                            setTypeFilter(e.target.value);
                                            handleFilterChange({ type: e.target.value || undefined });
                                        }}
                                        displayEmpty
                                        sx={{
                                            borderRadius: 2,
                                            height: '56px',
                                            backgroundColor: 'rgba(255, 152, 0, 0.02)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 152, 0, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'warning.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(255, 152, 0, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'warning.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TypeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography>All Project Types</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Test-Maps" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                <Typography>Test-Maps</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Production" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                                                <Typography>Production</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Development" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                                <Typography>Development</Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Box sx={{ position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ 
                                    mb: 1, 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <ActiveIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                    Project Status
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            handleFilterChange({ is_active: e.target.value || undefined });
                                        }}
                                        displayEmpty
                                        sx={{
                                            borderRadius: 2,
                                            height: '56px',
                                            backgroundColor: 'rgba(76, 175, 80, 0.02)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'success.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'success.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                                                <Typography>All Status Types</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="true" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ActiveIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                <Typography>Active Projects</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="false" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <InactiveIcon sx={{ fontSize: 18, color: 'error.main' }} />
                                                <Typography>Inactive Projects</Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Visibility */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Box sx={{ position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ 
                                    mb: 1, 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <PublicIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                    Project Visibility
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={publicFilter}
                                        onChange={(e) => {
                                            setPublicFilter(e.target.value);
                                            handleFilterChange({ is_public: e.target.value || undefined });
                                        }}
                                        displayEmpty
                                        sx={{
                                            borderRadius: 2,
                                            height: '56px',
                                            backgroundColor: 'rgba(33, 150, 243, 0.02)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(33, 150, 243, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'info.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(33, 150, 243, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'info.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                                                <Typography>All Visibility Types</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="true" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PublicIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                                <Typography>Public Projects</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="false" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PrivateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography>Private Projects</Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Sort By */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <Box sx={{ position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ 
                                    mb: 1, 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <CalendarIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                                    Sort Order
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={filters.ordering || '-updated_at'}
                                        onChange={(e) => {
                                            handleFilterChange({ ordering: e.target.value });
                                        }}
                                        sx={{
                                            borderRadius: 2,
                                            height: '56px',
                                            backgroundColor: 'rgba(156, 39, 176, 0.02)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(156, 39, 176, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'secondary.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                            '&.Mui-focused': {
                                                backgroundColor: 'rgba(156, 39, 176, 0.04)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'secondary.main',
                                                    borderWidth: '2px',
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="-updated_at" sx={{ py: 1.5 }}>
                                            <Typography>Latest Updated First</Typography>
                                        </MenuItem>
                                        <MenuItem value="updated_at" sx={{ py: 1.5 }}>
                                            <Typography>Oldest Updated First</Typography>
                                        </MenuItem>
                                        <MenuItem value="name" sx={{ py: 1.5 }}>
                                            <Typography>Name (A → Z)</Typography>
                                        </MenuItem>
                                        <MenuItem value="-name" sx={{ py: 1.5 }}>
                                            <Typography>Name (Z → A)</Typography>
                                        </MenuItem>
                                        <MenuItem value="-created_at" sx={{ py: 1.5 }}>
                                            <Typography>Latest Created First</Typography>
                                        </MenuItem>
                                        <MenuItem value="created_at" sx={{ py: 1.5 }}>
                                            <Typography>Oldest Created First</Typography>
                                        </MenuItem>
                                        <MenuItem value="state_abbr" sx={{ py: 1.5 }}>
                                            <Typography>State (A → Z)</Typography>
                                        </MenuItem>
                                        <MenuItem value="-state_abbr" sx={{ py: 1.5 }}>
                                            <Typography>State (Z → A)</Typography>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

            {/* Project Cards Section */}
            <Box sx={{ 
                width: '100%',
                maxWidth: '1400px', // Match filter panel max width
                mb: 4,
                px: 4, // Match the filter panel padding to align edges perfectly
            }}>
                <Grid container spacing={3}>
                {loading ? (
                    <Grid item xs={12}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            width: '100%',
                            minHeight: '300px'
                        }}>
                            <MapLoadingAnimation 
                                size="large" 
                                message="Loading project data from the database..." 
                            />
                        </Box>
                    </Grid>
                ) : projects.length === 0 ? (
                    <Grid item xs={12}>
                        <Box sx={{ 
                            textAlign: 'center', 
                            py: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            width: '100%'
                        }}>
                            <MapIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                            <Typography variant="h6" color="text.secondary">
                                No projects found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Try adjusting your filters to see more results
                            </Typography>
                        </Box>
                    </Grid>
                ) : (
                    projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                            <Card 
                                sx={{ 
                                    height: 440, // FIXED HEIGHT - NEVER CHANGES
                                    minHeight: 440, // ENFORCE MINIMUM
                                    maxHeight: 440, // ENFORCE MAXIMUM
                                    width: '100%', // FIXED WIDTH
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease-in-out',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                        borderColor: 'primary.main',
                                        '& .card-preview': {
                                            '& .preview-overlay': {
                                                opacity: 1,
                                            }
                                        }
                                    }
                                }}
                            >
                                {/* Preview Section - EXACT FIXED HEIGHT */}
                                <CardMedia
                                    className="card-preview"
                                    sx={{
                                        height: 160, // EXACT HEIGHT
                                        minHeight: 160, // FORCE MINIMUM
                                        maxHeight: 160, // FORCE MAXIMUM
                                        width: '100%', // FULL WIDTH
                                        flexShrink: 0, // NEVER SHRINK
                                        background: project.is_public 
                                            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)'
                                            : 'linear-gradient(135deg, rgba(158, 158, 158, 0.1) 0%, rgba(158, 158, 158, 0.05) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${project.is_public ? '4caf50' : '9e9e9e'}' fill-opacity='0.05'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            color: project.is_public ? 'success.main' : 'grey.500',
                                            zIndex: 2
                                        }}
                                    >
                                        <MapIcon sx={{ fontSize: 40, mb: 0.5 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                            Map Preview
                                        </Typography>
                                    </Box>
                                    
                                    {/* Hover overlay */}
                                    <Box
                                        className="preview-overlay"
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0,0,0,0.6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0,
                                            transition: 'opacity 0.3s ease',
                                            zIndex: 3
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                            Click to explore
                                        </Typography>
                                    </Box>
                                    
                                    {/* Status badges - Fixed positioning */}
                                    <Box sx={{ 
                                        position: 'absolute', 
                                        top: 12, 
                                        right: 12, 
                                        display: 'flex', 
                                        gap: 0.5, 
                                        flexDirection: 'column',
                                        zIndex: 4
                                    }}>
                                        <Chip
                                            icon={project.is_active ? <ActiveIcon /> : <InactiveIcon />}
                                            label={project.is_active ? "Active" : "Inactive"}
                                            size="small"
                                            color={project.is_active ? "success" : "error"}
                                            sx={{ 
                                                fontSize: '0.65rem',
                                                height: 20,
                                                backdropFilter: 'blur(8px)',
                                                backgroundColor: project.is_active 
                                                    ? 'rgba(76, 175, 80, 0.9)' 
                                                    : 'rgba(244, 67, 54, 0.9)',
                                                color: 'white',
                                                '& .MuiChip-icon': {
                                                    fontSize: 14,
                                                    color: 'white'
                                                }
                                            }}
                                        />
                                        
                                        <Chip
                                            icon={project.is_public ? <PublicIcon /> : <PrivateIcon />}
                                            label={project.is_public ? "Public" : "Private"}
                                            size="small"
                                            sx={{ 
                                                fontSize: '0.65rem',
                                                height: 20,
                                                backdropFilter: 'blur(8px)',
                                                backgroundColor: project.is_public 
                                                    ? 'rgba(33, 150, 243, 0.9)' 
                                                    : 'rgba(158, 158, 158, 0.9)',
                                                color: 'white',
                                                '& .MuiChip-icon': {
                                                    fontSize: 14,
                                                    color: 'white'
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardMedia>

                                {/* Content Section - EXACT FIXED HEIGHT */}
                                <CardContent sx={{ 
                                    height: 200, // EXACT HEIGHT
                                    minHeight: 200, // FORCE MINIMUM
                                    maxHeight: 200, // FORCE MAXIMUM
                                    width: '100%', // FULL WIDTH
                                    flexShrink: 0, // NEVER SHRINK
                                    flexGrow: 0, // NEVER GROW
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden' // PREVENT OVERFLOW
                                }}>
                                    {/* Top section - FIXED HEIGHT */}
                                    <Box sx={{ 
                                        height: 120, // EXACT HEIGHT FOR TOP SECTION
                                        minHeight: 120,
                                        maxHeight: 120,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start'
                                    }}>
                                        <Typography 
                                            variant="h6" 
                                            component="div"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '1.1rem',
                                                lineHeight: 1.3,
                                                height: '2.86rem', // EXACTLY 2 lines
                                                minHeight: '2.86rem',
                                                maxHeight: '2.86rem',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                mb: 1,
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {project.name}
                                        </Typography>

                                        {/* Location - FIXED HEIGHT */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            mb: 1, 
                                            gap: 0.5,
                                            height: '24px', // EXACT HEIGHT
                                            minHeight: '24px',
                                            maxHeight: '24px'
                                        }}>
                                            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {project.state_name} ({project.state_abbr})
                                            </Typography>
                                        </Box>

                                        {/* Type and Date - FIXED HEIGHT */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            mb: 1.5,
                                            height: '24px', // EXACT HEIGHT
                                            minHeight: '24px',
                                            maxHeight: '24px'
                                        }}>
                                            <Chip
                                                label={project.project_type}
                                                size="small"
                                                color={getProjectTypeColor(project.project_type) as any}
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem', height: 24 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(project.updated_at)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Bottom section - FIXED HEIGHT */}
                                    <Box sx={{ 
                                        height: 64, // EXACT HEIGHT FOR BOTTOM SECTION
                                        minHeight: 64,
                                        maxHeight: 64,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}>
                                        {/* Statistics row - FIXED HEIGHT */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            mb: 1.5,
                                            p: 1,
                                            height: '32px', // EXACT HEIGHT
                                            minHeight: '32px',
                                            maxHeight: '32px',
                                            backgroundColor: 'rgba(0,0,0,0.02)',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            alignItems: 'center'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LayersIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {project.total_layers_count}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <DatasetIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {project.total_features_count.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PeopleIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {project.assigned_clients.length}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Assigned Clients - FIXED HEIGHT */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1, 
                                            height: 32, // EXACT HEIGHT
                                            minHeight: 32,
                                            maxHeight: 32,
                                            overflow: 'hidden'
                                        }}>
                                            {project.assigned_clients.length > 0 && (
                                                <>
                                                <AvatarGroup 
                                                    max={4} 
                                                    sx={{ 
                                                        '& .MuiAvatar-root': { 
                                                            width: 28, 
                                                            height: 28, 
                                                            fontSize: '0.75rem',
                                                            border: '2px solid white',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }
                                                    }}
                                                >
                                                    {project.assigned_clients.map((client, index) => (
                                                        <Tooltip key={client.id} title={client.name} arrow>
                                                            <Avatar sx={{ bgcolor: `hsl(${(index * 137.5) % 360}, 65%, 55%)` }}>
                                                                {client.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {project.assigned_clients.length > 4 ? `${project.assigned_clients.length} clients` : ''}
                                                </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </CardContent>

                                {/* Action Buttons - EXACT FIXED HEIGHT */}
                                <CardActions sx={{ 
                                    height: 80, // EXACT HEIGHT
                                    minHeight: 80, // FORCE MINIMUM
                                    maxHeight: 80, // FORCE MAXIMUM
                                    width: '100%', // FULL WIDTH
                                    flexShrink: 0, // NEVER SHRINK
                                    flexGrow: 0, // NEVER GROW
                                    p: 2, 
                                    pt: 0, 
                                    display: 'flex', 
                                    gap: 1,
                                    alignItems: 'center' // CENTER BUTTONS
                                }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<MapIcon />}
                                        component={Link}
                                        to={`/viewer/${project.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        sx={{ 
                                            flex: 1,
                                            height: 36,
                                            minHeight: 36,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                            textDecoration: 'none',
                                            color: 'white',
                                            backgroundColor: 'primary.main',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                                                textDecoration: 'none',
                                                backgroundColor: 'primary.dark',
                                                color: 'white',
                                            },
                                            '&:focus': {
                                                textDecoration: 'none',
                                                color: 'white',
                                            },
                                            '&:visited': {
                                                color: 'white',
                                            },
                                            '&:active': {
                                                color: 'white',
                                            }
                                        }}
                                    >
                                        View Map
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<SettingsIcon />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConfigure(project);
                                        }}
                                        sx={{ 
                                            flex: 1,
                                            height: 36,
                                            minHeight: 36,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            borderWidth: 2,
                                            '&:hover': {
                                                borderWidth: 2,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }
                                        }}
                                    >
                                        Configure
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                    )}
                </Grid>
            </Box>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 4,
                    width: '100%',
                    maxWidth: '1400px',
                    px: 4, // Match the same padding as cards and filter
                }}>
                    <Pagination
                        count={pagination.total_pages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        sx={{
                            '& .MuiPaginationItem-root': {
                                borderRadius: 2,
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                },
                            },
                            '& .Mui-selected': {
                                background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                            }
                        }}
                    />
                </Box>
            )}

        </Box>
    );
};

export default ProjectViewerPage;