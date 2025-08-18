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
    viewBox="0 0 28 28"
    fill="none"
    stroke="none"
  >
    <g fill="${fill}" fill-rule="nonzero">
      <path d="M14,2.25 C19.3847763,2.25 23.75,6.61522369 23.75,12 
               C23.75,16.1196455 20.855433,20.6092677 15.1401958,25.5178507 
               C14.4843932,26.0810927 13.5155806,26.0810925 12.8571694,25.5155993 
               L12.4794181,25.1881258 C7.01712282,20.4088515 4.25,16.0278108 4.25,12 
               C4.25,6.61522369 8.61522369,2.25 14,2.25 Z 
               M14,8.25 C11.9289322,8.25 10.25,9.92893219 10.25,12 
               C10.25,14.0710678 11.9289322,15.75 14,15.75 
               C16.0710678,15.75 17.75,14.0710678 17.75,12 
               C17.75,9.92893219 16.0710678,8.25 14,8.25 Z">
      </path>
    </g>
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

      const pinColor = isHighlighted ? '#16A34A' : '#BBF7D0'; // Dark Red / Dark Blue
      const lineColor = isHighlighted ? '#16A34A' : '#BBF7D0'; // Bright Red / Deep Blue

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

