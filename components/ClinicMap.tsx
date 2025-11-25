import React, { useEffect, useRef } from 'react';
import { ClinicData } from '../types';

interface ClinicMapProps {
  data: ClinicData[];
  className?: string;
}

declare global {
    interface Window {
        L: any;
    }
}

export const ClinicMap: React.FC<ClinicMapProps> = ({ data, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (window.L) {
        const map = window.L.map(mapContainerRef.current).setView([22.3193, 114.1694], 11); // Default HK center
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapRef.current = map;
    }
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const markers: any[] = [];
    const validData = data.filter(c => c.LatLng);

    validData.forEach(clinic => {
        if (!clinic.LatLng) return;
        const [latStr, lngStr] = clinic.LatLng.split(',').map(s => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = window.L.marker([lat, lng])
                .bindPopup(`
                    <div class="font-sans">
                        <strong class="block mb-1 text-sm">${clinic.PHFName}</strong>
                        <span class="text-xs text-slate-600">${clinic.Address[0]?.Address || ''}</span>
                    </div>
                `);
            marker.addTo(mapRef.current);
            markers.push(marker);
        }
    });

    markersRef.current = markers;
    
  }, [data]);

  return (
    <div ref={mapContainerRef} className={`z-0 rounded-xl overflow-hidden shadow-sm border border-slate-200 ${className}`} />
  );
};