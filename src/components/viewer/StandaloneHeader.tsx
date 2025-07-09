// src/components/viewer/StandaloneHeader.tsx
import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

interface StandaloneHeaderProps {
    projectName?: string;
}

const HeaderContainer = styled(Box)({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '44px',
    backgroundColor: '#4CAF50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 2000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const Title = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
});

const CenterText = styled(Box)({
    flex: '1 1 0%',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'normal',
    color: 'white',
});

const ContactLink = styled(Link)({
    fontSize: '14px',
    fontWeight: 'normal',
    color: 'white',
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
    },
});

const StandaloneHeader: React.FC<StandaloneHeaderProps> = ({ projectName }) => {
    return (
        <HeaderContainer>
            <Title>
                Wireless2020 WebGisViewer
            </Title>
            <CenterText>
                {projectName}
            </CenterText>
            <ContactLink
                href="https://www.wireless2020.com/contact"
                target="_blank"
                rel="noopener noreferrer"
            >
                Contact support
            </ContactLink>
        </HeaderContainer>
    );
};

export default StandaloneHeader;
