import { FC } from "react";
import { Box, Typography, useTheme, Paper, useMediaQuery } from "@mui/material";
import LoginForm from "../../components/auth/LoginForm.tsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import illustration from "../../assets/Login Illustration.svg";

const LoginPage: FC = () => {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));


  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1000,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 6, md: 8 },
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        {/* Image Section - No Title */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src={illustration}
            alt="Illustration"
            sx={{
              width: "100%",
              maxWidth: { xs: 280, md: 500 },
              height: "auto",
            }}
          />
        </Box>

        {/* Form Section with Title */}
        <Box
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, md: 3 },
            // backgroundColor: "white",
            // borderRadius: 3,
            // boxShadow: 3,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              WebGIS Viewer V2
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Advanced Geospatial Visualization Platform
            </Typography>
          </Box>

          <LoginForm />

          {/* Optional: Image for mobile */}
          {isMobile && (
            <Box
              component="img"
              src={illustration}
              alt="Illustration"
              sx={{
                width: "100%",
                maxWidth: 300,
                mt: 4,
                mx: "auto",
                display: "block",
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
