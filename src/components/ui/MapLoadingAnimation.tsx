import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { Map as MapIcon, MyLocation as LocationIcon, Layers as LayersIcon } from '@mui/icons-material';

// Keyframe animations for GIS-themed loading
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const orbitAnimation = keyframes`
  0% {
    transform: rotate(0deg) translateX(30px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(30px) rotate(-360deg);
  }
`;

const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`;

const mapPinDrop = keyframes`
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  50% {
    transform: translateY(0px);
    opacity: 1;
  }
  100% {
    transform: translateY(0px);
    opacity: 1;
  }
`;

interface MapLoadingAnimationProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const MapLoadingAnimation: React.FC<MapLoadingAnimationProps> = ({
  size = 'medium',
  message = 'Loading projects...'
}) => {
  const sizeConfig = {
    small: { container: 60, icon: 24, fontSize: '0.875rem' },
    medium: { container: 80, icon: 32, fontSize: '1rem' },
    large: { container: 120, icon: 48, fontSize: '1.25rem' }
  };

  const config = sizeConfig[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        gap: 2
      }}
    >
      {/* Main loading animation container */}
      <Box
        sx={{
          position: 'relative',
          width: config.container,
          height: config.container,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Central map icon with pulse */}
        <MapIcon
          sx={{
            fontSize: config.icon,
            color: 'primary.main',
            animation: `${pulseAnimation} 2s ease-in-out infinite`,
            zIndex: 3,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />

        {/* Orbiting location icons */}
        <LocationIcon
          sx={{
            position: 'absolute',
            fontSize: config.icon * 0.5,
            color: 'secondary.main',
            animation: `${orbitAnimation} 3s linear infinite`,
            animationDelay: '0s'
          }}
        />
        
        <LocationIcon
          sx={{
            position: 'absolute',
            fontSize: config.icon * 0.4,
            color: 'success.main',
            animation: `${orbitAnimation} 3s linear infinite`,
            animationDelay: '1s',
            animationDirection: 'reverse'
          }}
        />

        <LayersIcon
          sx={{
            position: 'absolute',
            fontSize: config.icon * 0.35,
            color: 'warning.main',
            animation: `${orbitAnimation} 4s linear infinite`,
            animationDelay: '0.5s'
          }}
        />

        {/* Pulsing rings */}
        {[1, 2, 3].map((ring, index) => (
          <Box
            key={ring}
            sx={{
              position: 'absolute',
              width: config.container * (0.6 + index * 0.2),
              height: config.container * (0.6 + index * 0.2),
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: '50%',
              opacity: 0.3,
              animation: `${pulseAnimation} 2s ease-in-out infinite`,
              animationDelay: `${index * 0.3}s`
            }}
          />
        ))}

        {/* Animated dots around the circle */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
          <Box
            key={angle}
            sx={{
              position: 'absolute',
              width: 4,
              height: 4,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transformOrigin: '0 0',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${config.container * 0.45}px)`,
              animation: `${fadeInOut} 2s ease-in-out infinite`,
              animationDelay: `${index * 0.2}s`
            }}
          />
        ))}
      </Box>

      {/* Loading message */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          fontSize: config.fontSize,
          fontWeight: 500,
          textAlign: 'center',
          animation: `${fadeInOut} 2s ease-in-out infinite`
        }}
      >
        {message}
      </Typography>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[0, 1, 2].map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 6,
              height: 6,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              animation: `${mapPinDrop} 1.5s ease-in-out infinite`,
              animationDelay: `${dot * 0.3}s`
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MapLoadingAnimation;