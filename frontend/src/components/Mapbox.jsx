

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const Mapbox = ({ users = [], highlightedUserId = null }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});              // Stores per-user markers
  const lineLayerIdsRef = useRef([]);         // Stores added path layers
  const styleLoadedRef = useRef(false);

  // Initialize Map
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [80.6337, 7.8731],
      zoom: 6,
    });

    mapRef.current.on('style.load', () => {
      styleLoadedRef.current = true;
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // Update map when users or highlighted user changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;

    // 🚮 Clear previous markers
    Object.values(markersRef.current).forEach(markerArray => {
      markerArray.forEach(marker => marker.remove());
    });
    markersRef.current = {};

    // 🚮 Clear previous path layers
    lineLayerIdsRef.current.forEach(({ layerId, sourceId }) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    lineLayerIdsRef.current = [];

    // 🧭 Loop through users to draw markers and paths
    users.forEach(user => {
      const { uid, gps = [] } = user;
      if (!gps.length) return;

      const coordinates = gps.map(({ lng, lat }) => [lng, lat]);

      // 📍 Add Markers for each point
      /*const markerColor = userId === highlightedUserId ? '#1E3A8A' : '#93C5FD';

      markersRef.current[userId] = gps.map(({ lat, lng }) => {
        return new mapboxgl.Marker({ color: markerColor })
          .setLngLat([lng, lat])
          .addTo(map);
      });*/ 
      const markerColor = uid === highlightedUserId ? '#1E3A8A' : '#93C5FD';

      markersRef.current[uid] = gps.map(({ lat, lng }) => {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = markerColor;
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.4)';
        el.style.cursor = 'pointer';

        return new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .addTo(map);
});


      // ➖ Draw Path (LineString)
      const sourceId = `line-source-${uid}`;
      const layerId = `line-layer-${uid}`;

      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': uid === highlightedUserId ? '#1E3A8A' : '#0074D9',
            'line-width': uid === highlightedUserId ? 5 : 3,
            'line-opacity': uid === highlightedUserId ? 1 : 0.5,
          },
        });

        lineLayerIdsRef.current.push({ layerId, sourceId });
      } catch (err) {
        console.error(`Error adding layer for ${uid}:`, err);
      }
    });
  }, [users, highlightedUserId]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-xl shadow"
    />
  );
};

export default Mapbox;





