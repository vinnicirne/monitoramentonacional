import { useEffect, useRef, type RefObject } from 'react';
import OlMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Cluster from 'ol/source/Cluster';
import Point from 'ol/geom/Point';
import { boundingExtent, buffer } from 'ol/extent';
import { unByKey } from 'ol/Observable';
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
  icon.setAttribute('aria-hidden', 'true');
  icon.width = 48;
  icon.height = 48;
  icon.style.cssText = 'display:block;width:16px;height:16px';
  const ctx = icon.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4, 11);
  ctx.lineTo(6.4, 5.5);
  ctx.quadraticCurveTo(7, 4, 9, 4);
  ctx.lineTo(15, 4);
  ctx.quadraticCurveTo(17, 4, 17.6, 5.5);
  ctx.lineTo(20, 11);
  ctx.roundRect(3, 10, 18, 9, 3);
  ctx.moveTo(5, 19);
  ctx.lineTo(5, 21);
  ctx.moveTo(19, 19);
  ctx.lineTo(19, 21);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(6, 13, 3, 2);
  ctx.fillRect(15, 13, 3, 2);
  return icon;
}

type VehicleFeature = Feature<Point>;

export function useCompanyVehicleLayer(
  mapRef: RefObject<OlMap | null>,
  vehicles: DriverPosition[],
  selected?: DriverPosition,
  select?: (uid: string) => void,
) {
  const updateVehicles = useRef<(positions: DriverPosition[]) => void>(() => {});
  const routeSource = useRef<VectorSource<Feature<LineString>> | null>(null);
  const selection = useRef(select);
  useEffect(() => { selection.current = select; }, [select]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const points = new VectorSource<VehicleFeature>();
    const groups = new Cluster({ source: points, distance: 40, minDistance: 30, wrapX: false });
    const source = new VectorSource<Feature<LineString>>({ wrapX: false });
    const routes = new VectorLayer({ source, zIndex: 210 });
    const markers = new Map<string, Overlay>();
    const view = map.getView();
    let current = new Map<string, DriverPosition>();
    let openDrivers: string[] = [];
    let opener: HTMLElement | undefined;
    const picker = document.createElement('section');
    picker.hidden = true;
    picker.className = 'pointer-events-auto absolute left-3 top-12 z-10 w-52 max-w-[calc(100%-1.5rem)] rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-lg';
    picker.setAttribute('aria-label', 'Motoristas agrupados');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Fechar lista';
    close.className = 'mb-1 w-full rounded px-2 py-1 text-left text-xs font-bold text-blue-800 hover:bg-blue-50';
    const list = document.createElement('ul');
    list.className = 'max-h-40 overflow-y-auto';
    picker.append(close, list);
    map.getOverlayContainerStopEvent().append(picker);

    function closePicker(restoreFocus = false) {
      openDrivers = [];
      picker.hidden = true;
      list.replaceChildren();
      if (restoreFocus) (opener?.isConnected ? opener : map.getTargetElement())?.focus();
    }
    close.onclick = () => closePicker(true);
    picker.onkeydown = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closePicker(true);
      }
    };

    function syncPicker() {
      if (!openDrivers.length) return;
      for (const item of Array.from(list.children)) {
        const button = item.firstElementChild as HTMLButtonElement;
        const driver = current.get(button.value);
        if (driver) button.textContent = driver.name;
        else item.remove();
      }
      if (!list.children.length) closePicker();
    }

    function showGroup(members: VehicleFeature[], button: HTMLElement) {
      openDrivers = members.map(feature => String(feature.getId()));
      opener = button;
      const entries = openDrivers.map(uid => current.get(uid)).filter(driver => driver !== undefined);
      entries.sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
      list.replaceChildren(...entries.map(driver => {
        const item = document.createElement('li');
        const option = document.createElement('button');
        option.type = 'button';
        option.value = driver.uid;
        option.textContent = driver.name;
        option.className = 'w-full truncate rounded px-2 py-2 text-left text-xs hover:bg-blue-50';
        option.onclick = () => {
          closePicker();
          selection.current?.(driver.uid);
        };
        item.append(option);
        return item;
      }));
      picker.hidden = false;
      close.focus({ preventScroll: true });
      const coordinates = members.map(feature => feature.getGeometry()!.getCoordinates());
      const zoom = view.getZoom();
      const size = map.getSize();
      if (zoom !== undefined && zoom < 17 && size) {
        view.fit(boundingExtent(coordinates), {
          padding: [32, 32, 32, 32],
          maxZoom: 17,
          duration: 240,
        });
      }
    }

    function renderMarkers() {
      const size = map.getSize();
      const resolution = view.getResolution();
      if (!size?.every(value => value > 0) || !resolution) return;
      const visible = buffer(view.calculateExtent(size), resolution * 40);
      groups.loadFeatures(visible, resolution, view.getProjection());
      const visibleKeys = new Set<string>();

      for (const group of groups.getFeaturesInExtent(visible)) {
        const coordinates = (group.getGeometry() as Point).getCoordinates();
        const members: VehicleFeature[] = group.get('features');
        const count = members.length;
        const uid = String(members[0].getId());
        const key = count === 1 ? uid : JSON.stringify(members.map(feature => feature.getId()).sort());
        visibleKeys.add(key);
        let overlay = markers.get(key);
        if (!overlay) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = count === 1
            ? 'grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white shadow hover:ring-2 hover:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600'
            : 'grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-blue-800 text-[10px] font-bold tabular-nums text-white shadow hover:ring-2 hover:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600';
          if (count === 1) {
            button.style.width = '24px';
            button.style.height = '24px';
            button.append(car(vehicleColor(uid)));
          }
          else button.textContent = count > 999 ? '999+' : String(count);

          overlay = new Overlay({ element: button, positioning: 'center-center', stopEvent: true });
          markers.set(key, overlay);
          map.addOverlay(overlay);
        }
        const button = overlay.getElement() as HTMLButtonElement;
        const label = count === 1 ? 'Ver ficha de ' + current.get(uid)?.name : 'Ver ' + count + ' veículos agrupados';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.onclick = () => {
          if (count > 1) showGroup(members, button);
          else {
            closePicker();
            selection.current?.(uid);
          }
        };
        overlay.setPosition(coordinates);
      }

      for (const [key, overlay] of markers) {
        if (visibleKeys.has(key)) continue;
        map.removeOverlay(overlay);
        markers.delete(key);
      }
    }

    routeSource.current = source;
    updateVehicles.current = positions => {
      current = new Map(positions.map(driver => [driver.uid, driver]));
      points.clear(true);
      points.addFeatures(positions.map(driver => {
        const feature = new Feature(new Point(fromLonLat(driver.position)));
        feature.setId(driver.uid);
        return feature;
      }));
      syncPicker();
      renderMarkers();
    };
    map.addLayer(routes);
    const events = map.on(['moveend', 'change:size'], renderMarkers);
    return () => {
      unByKey(events);
      groups.setSource(null);
      for (const overlay of markers.values()) map.removeOverlay(overlay);
      picker.remove();
      map.removeLayer(routes);
      routeSource.current = null;
      updateVehicles.current = () => {};
    };
  }, [mapRef]);

  useEffect(() => updateVehicles.current(vehicles), [vehicles]);

  useEffect(() => {
    const source = routeSource.current;
    if (!source) return;
    source.clear(true);
    if (!selected || selected.route.length < 4) return;

    const coordinates = [];
    for (let i = 0; i < selected.route.length; i += 2) {
      coordinates.push(fromLonLat([selected.route[i], selected.route[i + 1]]));
    }
    const feature = new Feature(new LineString(coordinates));
    feature.setStyle(new Style({ stroke: new Stroke({ color: vehicleColor(selected.uid), width: 4 }) }));
    source.addFeature(feature);
  }, [selected]);
}
