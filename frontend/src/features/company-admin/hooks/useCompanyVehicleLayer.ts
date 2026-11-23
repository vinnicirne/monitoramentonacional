import { useEffect, useRef, type RefObject } from 'react';
import OlMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Stroke, Style } from 'ol/style';
import type { DriverPosition } from '../services/driveCompanyApi';

export function vehicleColor(uid: string) {
  const colors = ['#1d56c5', '#08785f', '#993990', '#a64419', '#4f46a0', '#9b2450'];
  return colors[[...uid].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
}

function car(color: string) {
  const icon = document.createElement('canvas');
  icon.width = 48;
  icon.height = 58;
  icon.className = 'h-7 w-6';
  const ctx = icon.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.fillStyle = '#1e293b';
  for (const x of [2, 18]) {
    ctx.fillRect(x, 6, 4, 6);
    ctx.fillRect(x, 17, 4, 6);
  }
  ctx.beginPath();
  ctx.roundRect(4, 2, 16, 25, 5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(7, 7, 10, 5);
  ctx.fillRect(7, 18, 10, 4);
  return icon;
}

export function useCompanyVehicleLayer(mapRef: RefObject<OlMap | null>, vehicles: DriverPosition[], select?: (uid: string) => void) {
  const layers = useRef<{ map: OlMap; source: VectorSource; markers: Map<string, Overlay> } | null>(null);
  const selection = useRef(select);
  useEffect(() => { selection.current = select; }, [select]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = new VectorSource();
    const routes = new VectorLayer({ source, zIndex: 210 });
    const markers = new Map<string, Overlay>();
    layers.current = { map, source, markers };
    map.addLayer(routes);
    return () => {
      for (const overlay of markers.values()) map.removeOverlay(overlay);
      map.removeLayer(routes);
      layers.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const instance = layers.current;
    if (!instance) return;
    const { map, source, markers } = instance;
    const present = new Set(vehicles.map(vehicle => vehicle.uid));
    for (const [uid, overlay] of markers) {
      if (!present.has(uid)) {
        map.removeOverlay(overlay);
        markers.delete(uid);
      }
    }
    const routes: Feature[] = [];
    for (const vehicle of vehicles) {
      const shade = vehicleColor(vehicle.uid);
      let overlay = markers.get(vehicle.uid);
      if (!overlay) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'grid min-h-10 min-w-10 place-items-center rounded-full border border-slate-200 bg-white shadow-md hover:ring-2 hover:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600';
        button.append(car(shade));
        button.onclick = () => selection.current?.(vehicle.uid);
        overlay = new Overlay({ element: button, positioning: 'center-center', stopEvent: true });
        markers.set(vehicle.uid, overlay);
        map.addOverlay(overlay);
      }
      const button = overlay.getElement();
      button?.setAttribute('aria-label', 'Ver ficha de ' + vehicle.name);
      button?.setAttribute('title', vehicle.name);
      overlay.setPosition(fromLonLat(vehicle.position));
      if (vehicle.route.length >= 4) {
        const points = [];
        for (let i = 0; i < vehicle.route.length; i += 2) points.push(fromLonLat([vehicle.route[i], vehicle.route[i + 1]]));
        const feature = new Feature(new LineString(points));
        feature.setStyle(new Style({ stroke: new Stroke({ color: shade, width: 4 }) }));
        routes.push(feature);
      }
    }
    source.clear(true);
    source.addFeatures(routes);
  }, [vehicles]);
}
