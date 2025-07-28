// Experimental refactored viewer page
import React, { useEffect, useRef } from 'react';
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

    const isPublic = location.pathname.startsWith('/public-viewer-dev/');
    const identifier = isPublic ? hash : id;

    useEffect(() => {
        if (!identifier || !mapRef.current) return;
        const map = L.map(mapRef.current).setView([0, 0], 2);
        const controller = new ProjectController(identifier, isPublic);
        controller.attachMap(map);
        controller.loadProject();
        controllerRef.current = controller;
        return () => {
            map.remove();
        };
    }, [identifier, isPublic]);

    if (!identifier) {
        return <StandaloneLoadingScreen progress={0} statusMessage="Loading..." />;
    }

    return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
};

export default StandaloneViewerPageDev;
