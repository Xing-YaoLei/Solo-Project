import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { RegionFunnel } from '../types';

interface MapboxChartProps {
  data: RegionFunnel[];
  mapboxToken?: string;
  onRegionClick?: (region: RegionFunnel) => void;
}

const MapboxChart = ({
  data,
  mapboxToken = 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrcmF0ZXN5ZjBpcGUyd3BmbTZ5dWx4YXEifQ.demo-token',
  onRegionClick,
}: MapboxChartProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [104.1954, 35.8617],
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!isLoaded || !map.current || data.length === 0) return;

    const mapInstance = map.current;

    if (mapInstance.getSource('regions')) {
      mapInstance.removeLayer('regions-fill');
      mapInstance.removeLayer('regions-outline');
      mapInstance.removeSource('regions');
    }

    const features = data.map((region, index) => {
      const rate = region.completion_rate || 0;
      let color = '#52c41a';
      if (rate < 60) color = '#ff4d4f';
      else if (rate < 80) color = '#faad14';

      return {
        type: 'Feature' as const,
        properties: {
          name: region.region_name,
          code: region.region_code,
          completion_rate: rate,
          total_enrolled: region.total_enrolled,
          received: region.received,
          color,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [
            100 + (index % 10) * 3 + Math.random() * 2,
            30 + Math.floor(index / 10) * 5 + Math.random() * 3,
          ],
        },
      };
    });

    mapInstance.addSource('regions', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    mapInstance.addLayer({
      id: 'regions-circle',
      type: 'circle',
      source: 'regions',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'total_enrolled'],
          0,
          10,
          1000,
          40,
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    mapInstance.on('click', 'regions-circle', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties as any;
        const region = data.find((r) => r.region_code === props.code);
        if (region && onRegionClick) {
          onRegionClick(region);
        }
      }
    });

    mapInstance.on('mouseenter', 'regions-circle', () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = 'pointer';
    });

    mapInstance.on('mouseleave', 'regions-circle', () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = '';
    });
  }, [data, isLoaded, onRegionClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'white',
        padding: '12px 16px',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>完成率图例</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#52c41a' }} />
          <span>≥80% 良好</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#faad14' }} />
          <span>60%-80% 预警</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff4d4f' }} />
          <span>{'<60% 危险'}</span>
        </div>
      </div>
    </div>
  );
};

export default MapboxChart;
