import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Location pin SVG icon with customizable fill color
const getLocationPinSVG = (fill = '#0D47A1') => `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="30"
    height="30"
    fill="${fill}"
    stroke="#ffffff"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
  </svg>
`;

const Mapbox = ({ users = [], highlightedUserId = null }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const lineLayerIdsRef = useRef([]);
  const styleLoadedRef = useRef(false);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [80.6337, 7.8731],
      zoom: 7,
    });

    mapRef.current.on('style.load', () => {
      styleLoadedRef.current = true;
    });

    return () => mapRef.current?.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(arr => arr.forEach(m => m.remove()));
    markersRef.current = {};

    // Remove old lines
    lineLayerIdsRef.current.forEach(({ layerId, sourceId }) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    lineLayerIdsRef.current = [];

    users.forEach(user => {
      const { userId, gps = [] } = user;
      if (!gps.length) return;

      const coordinates = gps.map(({ lng, lat }) => [lng, lat]);
      const isHighlighted = userId === highlightedUserId;

      const pinColor = isHighlighted ? '#B71C1C' : '#0D47A1'; // Dark Red / Dark Blue
      const lineColor = isHighlighted ? '#E53935' : '#1565C0'; // Bright Red / Deep Blue

      // Create markers with custom SVG pins
      markersRef.current[userId] = gps.map(({ lat, lng }) => {
        const el = document.createElement('div');
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.cursor = 'pointer';
        el.style.filter = 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.4))';
        el.innerHTML = getLocationPinSVG(pinColor);
        return new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
      });

      const sourceId = `line-source-${userId}`;
      const layerId = `line-layer-${userId}`;

      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': lineColor,
            'line-width': isHighlighted ? 6 : 4,
            'line-opacity': isHighlighted ? 0.95 : 0.75,
          },
        });

        lineLayerIdsRef.current.push({ layerId, sourceId });
      } catch (err) {
        console.error(`Error adding layer for ${userId}:`, err);
      }
    });
  }, [users, highlightedUserId]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-xl shadow-lg border border-blue-900"
      style={{ minHeight: '400px' }}
    />
  );
};

export default Mapbox;
