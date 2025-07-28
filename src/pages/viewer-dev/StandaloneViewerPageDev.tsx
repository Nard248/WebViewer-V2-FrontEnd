import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StandaloneLoadingScreen from '../../components/viewer/StandaloneLoadingScreen';
import ProjectController from '../../classes/project/ProjectController';

const StandaloneViewerPageDev: React.FC = () => {
  const { id, hash } = useParams<{ id?: string; hash?: string }>();
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ProjectController | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  const isPublic = location.pathname.startsWith('/public-viewer-dev/');
  const identifier = isPublic ? hash : id;

  useEffect(() => {
    if (!identifier) {
      setError('No project identifier provided');
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeProject = async () => {
      try {
        setLoading(true);
        setProgress(10);
        setStatus('Creating map...');

        const map = L.map(mapRef.current!, {
          center: [40.0, -83.0],
          zoom: 7,
          zoomControl: false,
          attributionControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        setProgress(30);
        setStatus('Initializing project controller...');

        const controller = new ProjectController(identifier, isPublic);
        controller.attachMap(map);
        controllerRef.current = controller;

        setProgress(50);
        setStatus('Loading project data...');

        await controller.loadProject();

        if (mounted) {
          setProgress(100);
          setStatus('Complete!');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('StandaloneViewerPageDev initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load project');
          setLoading(false);
        }
      }
    };

    initializeProject();

    return () => {
      mounted = false;
      if (controllerRef.current && mapRef.current) {
        const mapInstance = (mapRef.current as any)._leaflet_map;
        if (mapInstance) {
          mapInstance.remove();
        }
      }
    };
  }, [identifier, isPublic]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Error Loading Project</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <StandaloneLoadingScreen
          progress={progress}
          statusMessage={status}
          projectName="Development Project"
        />
      )}
      <div
        ref={mapRef}
        style={{ height: '100vh', width: '100%', display: loading ? 'none' : 'block' }}
      />
    </>
  );
};

export default StandaloneViewerPageDev;
