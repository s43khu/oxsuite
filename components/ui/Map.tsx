"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";

interface MapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  className?: string;
}

export function Map({ latitude, longitude, city, country, className = "" }: MapProps) {
  const { theme, themeId } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  const getHueRotate = (primaryColor: string) => {
    const hex = primaryColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max === min) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const greenHue = 120;
    const hueDiff = h - greenHue;
    return hueDiff;
  };

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
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[src*="leaflet.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          setTimeout(() => initializeMap(), 100);
        });
        if ((window as any).L) {
          setTimeout(() => initializeMap(), 100);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => {
        setTimeout(() => initializeMap(), 100);
      };
      script.onerror = () => {
        console.error("Failed to load Leaflet");
        setMapLoaded(false);
      };
      document.body.appendChild(script);
    };

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) {
        console.error("Leaflet not loaded or map ref missing");
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
          keyboard: false,
        }).setView([latitude, longitude], 10);

        const hueRotate = getHueRotate(theme.colors.primary);
        const styleId = `leaflet-theme-style-${themeId}`;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          className: `map-tiles-theme-${themeId}`,
        }).addTo(map);

        L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div style="width: 20px; height: 20px; background: ${theme.colors.primary}; border: 2px solid ${theme.colors.primary}; border-radius: 50%; box-shadow: 0 0 10px ${hexToRgba(theme.colors.primary, 0.8)};"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);

        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .map-tiles-theme-${themeId} {
              filter: hue-rotate(${hueRotate}deg) saturate(0.5) brightness(0.8) contrast(1.2);
            }
            .leaflet-container {
              background: ${theme.colors.background} !important;
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
      } catch (error) {
        console.error("Error initializing map:", error);
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
          console.error("Error removing map:", e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, theme]);

  if (!latitude || !longitude) {
    return (
      <div
        className={`w-full h-64 border-2 rounded-lg flex items-center justify-center ${className}`}
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.primary,
        }}
      >
        <p className="font-mono" style={{ color: theme.colors.primary }}>
          No location data available
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!mapLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
          style={{ backgroundColor: theme.colors.background }}
        >
          <p className="font-mono animate-pulse" style={{ color: theme.colors.primary }}>
            Loading map...
          </p>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border-2 pointer-events-none"
        style={{
          background: theme.colors.background,
          borderColor: theme.colors.primary,
          boxShadow: `0 0 20px ${hexToRgba(theme.colors.primary, 0.3)}`,
          minHeight: "256px",
          zIndex: 1,
        }}
      />
      {(city || country) && (
        <div
          className="absolute top-2 left-2 border px-3 py-1 rounded font-mono text-sm z-[1000]"
          style={{
            backgroundColor: `${theme.colors.background}e6`,
            borderColor: theme.colors.primary,
            color: theme.colors.primary,
          }}
        >
          {city && country ? `${city}, ${country}` : city || country}
        </div>
      )}
    </div>
  );
}
