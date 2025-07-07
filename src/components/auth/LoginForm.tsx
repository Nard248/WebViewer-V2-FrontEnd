import { useState, FC, FormEvent } from "react";

import {
  TextField,
  Button,
  Box,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import withLoading from "../../hoc/withLoading";

interface LoginFormProps {
  setLoading?: (loading: boolean) => void;
}

const LoginForm: FC<LoginFormProps> = ({ setLoading }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    clearError();
    setLoading?.(true);

    try {
      await login({ username, password });
      
      // Check if there's a redirect URL from the query parameters
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        // Decode the URL and navigate to it
        const decodedUrl = decodeURIComponent(redirectUrl);
        navigate(decodedUrl);
      } else {
        // Default redirect to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading?.(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    // <FormContainer elevation={3}>
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            variant="h5"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Welcome Back!
          </Typography>
          {/* <Typography variant="body2" color="text.secondary">
            Sign in to access WebGIS Viewer V2
          </Typography> */}
        </Box>

        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
          InputProps={{
            autoComplete: "username",
          }}
        />

        <TextField
          label="Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          InputProps={{
            autoComplete: "current-password",
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Alert severity="error" onClose={clearError}>
            Oops! The Username or Password you entered is incorrect. Please try
            again.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
          label="Remember me"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={isLoading || !username || !password}
          startIcon={<LoginIcon />}
        >
          Sign In
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            fontSize: "0.875rem",
          }}
        >
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            underline="hover"
          >
            Forgot password?
          </Link>
          <Link component={RouterLink} to="/register" underline="hover">
          Create an account
        </Link>
        </Box>
      </Box>
    // </FormContainer>
  );
};

export default withLoading(LoginForm);