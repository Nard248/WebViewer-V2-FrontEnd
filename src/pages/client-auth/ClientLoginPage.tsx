import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Alert,
    Link,
    Divider,
    Avatar,
    Paper,
    Container,
    InputAdornment,
    IconButton,
    CircularProgress,
    Fade
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person,
    Lock,
    Business,
    ArrowForward
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useClientAuth } from '../../context/ClientAuthContext';

interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

const loginSchema = yup.object({
    email: yup
        .string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: yup
        .string()
        .min(1, 'Password is required')
        .required('Password is required'),
    rememberMe: yup.boolean()
});

const ClientLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading, error, clearError } = useClientAuth();
    
    const [showPassword, setShowPassword] = useState(false);
    const [loginAttempting, setLoginAttempting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            const redirectTo = (location.state as any)?.from?.pathname || '/client/dashboard';
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, location]);

    // Clear errors when component mounts or form is reset
    useEffect(() => {
        clearError();
    }, [clearError]);

    const onSubmit = async (data: LoginFormData) => {
        setLoginAttempting(true);
        try {
            await login(data.email, data.password, data.rememberMe);
        } catch (err) {
            // Error is handled by context
        } finally {
            setLoginAttempting(false);
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleForgotPassword = () => {
        navigate('/client-auth/forgot-password');
    };

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                bgcolor="background.default"
            >
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Fade in timeout={600}>
                    <Paper
                        elevation={24}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        {/* Header Section */}
                        <Box
                            sx={{
                                background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                color: 'white',
                                p: 4,
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -50,
                                    right: -50,
                                    width: 150,
                                    height: 150,
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -30,
                                    left: -30,
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                }}
                            />
                            
                            <Avatar
                                sx={{
                                    mx: 'auto',
                                    mb: 2,
                                    width: 64,
                                    height: 64,
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    border: '2px solid rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <Business fontSize="large" />
                            </Avatar>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                Client Portal
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                Access your project workspace
                            </Typography>
                        </Box>

                        {/* Login Form */}
                        <CardContent sx={{ p: 4 }}>
                            {error && (
                                <Alert 
                                    severity="error" 
                                    sx={{ mb: 3, borderRadius: 2 }}
                                    onClose={clearError}
                                >
                                    {error}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                <Box display="flex" flexDirection="column" gap={3}>
                                    <TextField
                                        {...register('email')}
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        disabled={isSubmitting || loginAttempting}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            }
                                        }}
                                    />

                                    <TextField
                                        {...register('password')}
                                        fullWidth
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                        disabled={isSubmitting || loginAttempting}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleTogglePasswordVisibility}
                                                        edge="end"
                                                        disabled={isSubmitting || loginAttempting}
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            }
                                        }}
                                    />

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    {...register('rememberMe')}
                                                    disabled={isSubmitting || loginAttempting}
                                                    color="primary"
                                                />
                                            }
                                            label="Remember me"
                                        />

                                        <Link
                                            component="button"
                                            type="button"
                                            onClick={handleForgotPassword}
                                            variant="body2"
                                            color="primary"
                                            sx={{ textDecoration: 'none' }}
                                            disabled={isSubmitting || loginAttempting}
                                        >
                                            Forgot password?
                                        </Link>
                                    </Box>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="large"
                                        variant="contained"
                                        disabled={isSubmitting || loginAttempting}
                                        endIcon={
                                            loginAttempting ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                <ArrowForward />
                                            )
                                        }
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #1976d2, #1ba3d4)',
                                            }
                                        }}
                                    >
                                        {loginAttempting ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </Box>
                            </form>

                            <Box mt={4}>
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Need help?
                                    </Typography>
                                </Divider>

                                <Box textAlign="center">
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Contact your project administrator for access
                                    </Typography>
                                    <Link
                                        component={RouterLink}
                                        to="/"
                                        variant="body2"
                                        color="primary"
                                        sx={{ textDecoration: 'none' }}
                                    >
                                        Back to main site
                                    </Link>
                                </Box>
                            </Box>
                        </CardContent>

                        {/* Demo Credentials */}
                        <Box
                            sx={{
                                bgcolor: 'grey.50',
                                p: 2,
                                borderTop: 1,
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                Demo credentials: test@example.com / password
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default ClientLoginPage;