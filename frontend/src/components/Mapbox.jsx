import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Location pin SVG icon with customizable fill color
function getLocationPinSVG(fill = '#4ADE80') {
  return `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="${fill}"
  >
    <rect x="0" fill="none" width="20" height="20"/>
    <path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 
             3.58-8 8-8zm0 13c2.76 0 5-2.24 5-5s-2.24-5-5-5
             -5 2.24-5 5 2.24 5 5 5z"/>
  </svg>
  `;
}



const Mapbox = ({ users = [], highlightedUserId = null }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const lineLayerIdsRef = useRef([]);
  const styleLoadedRef = useRef(false);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // changed to dark map style
      center: [80.6337, 7.8731],
      zoom: 7,
    });

    mapRef.current.on('style.load', () => {
      styleLoadedRef.current = true;
      // ⬅ Fetch your map.geojson file
    fetch("/map.geojson")
      .then((res) => res.json())
      .then((data) => {
        // Add source
        mapRef.current.addSource("milestones", {
          type: "geojson",
          data,
        });

        // Add a layer to display milestone points
        mapRef.current.addLayer({
          id: "milestones-layer",
          type: "circle",
          source: "milestones",
          paint: {
            "circle-radius": 6,
            "circle-color": "#FFD700", // Gold color
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });

        // Optional: milestone labels if properties have "name"
        mapRef.current.addLayer({
          id: "milestones-labels",
          type: "symbol",
          source: "milestones",
          layout: {
            "text-field": ["get", "name"], // takes "name" property from GeoJSON
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-size": 12,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#BBF7D0",
            "text-halo-width": 0.5
   
          },
        });
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
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

      const pinColor = isHighlighted ? '#EF4444' : '#BBF7D0'; // Dark Red / Dark Blue
      const lineColor = isHighlighted ? '#EF4444' : '#BBF7D0'; // Bright Red / Deep Blue

      // Create markers with custom SVG pins
      markersRef.current[userId] = gps.map(({ lat, lng }) => {
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
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
            'line-width': isHighlighted ? 4 : 2,
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
      className="w-full h-full rounded-2xl shadow-lg border border-gray-800 "
      style={{ minHeight: '400px' }}
    />
  );
};

export default Mapbox;

