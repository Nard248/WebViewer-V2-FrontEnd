import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export interface WithLoadingProps {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithLoadingProps>
) => {
  return (props: P) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <>
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <CircularProgress size={60} />
          </div>
        )}
        <WrappedComponent 
          {...props} 
          isLoading={isLoading} 
          setLoading={setIsLoading} 
        />
      </>
    );
  };
};

export default withLoading;