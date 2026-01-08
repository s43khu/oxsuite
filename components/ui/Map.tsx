'use client';

import { useEffect, useRef, useState } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  className?: string;
}

export function Map({ latitude, longitude, city, country, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    if (mapLoaded) return;

    const loadLeaflet = () => {
      if ((window as any).L) {
        setTimeout(() => initializeMap(), 100);
        return;
      }

      const existingLink = document.querySelector('link[href*="leaflet.css"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[src*="leaflet.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setTimeout(() => initializeMap(), 100);
        });
        if ((window as any).L) {
          setTimeout(() => initializeMap(), 100);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        setTimeout(() => initializeMap(), 100);
      };
      script.onerror = () => {
        console.error('Failed to load Leaflet');
        setMapLoaded(false);
      };
      document.body.appendChild(script);
    };

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) {
        console.error('Leaflet not loaded or map ref missing');
        return;
      }

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        if (!mapRef.current) return;

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
          boxZoom: false,
          keyboard: false
        }).setView([latitude, longitude], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          className: 'map-tiles-green'
        }).addTo(map);

        L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="width: 20px; height: 20px; background: #00ff00; border: 2px solid #00ff00; border-radius: 50%; box-shadow: 0 0 10px #00ff00;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);

        if (!document.getElementById('leaflet-green-style')) {
          const style = document.createElement('style');
          style.id = 'leaflet-green-style';
          style.textContent = `
            .map-tiles-green {
              filter: hue-rotate(120deg) saturate(0.5) brightness(0.8) contrast(1.2);
            }
            .leaflet-container {
              background: #000000 !important;
              pointer-events: none !important;
              cursor: default !important;
            }
            .leaflet-container * {
              pointer-events: none !important;
              cursor: default !important;
            }
            .leaflet-control-zoom {
              display: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapLoaded(false);
      }
    };

    const timer = setTimeout(() => {
      loadLeaflet();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className={`w-full h-64 bg-black border-2 border-green-500 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-green-500 font-mono">No location data available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 rounded-lg">
          <p className="text-green-500 font-mono animate-pulse">Loading map...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)] pointer-events-none"
        style={{ background: '#000000', minHeight: '256px', zIndex: 1 }}
      />
      {(city || country) && (
        <div className="absolute top-2 left-2 bg-black/90 border border-green-500 px-3 py-1 rounded font-mono text-green-500 text-sm z-[1000]">
          {city && country ? `${city}, ${country}` : city || country}
        </div>
      )}
    </div>
  );
}
