import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { useCompanyVehicleLayer, vehicleColor } from '../hooks/useCompanyVehicleLayer';
import { useCompanyDriverPositions } from '../hooks/useCompanyDriverPositions';
import DriverDetails from './DriverDetails';

type RegisteredDriver = { uid: string; email: string; driverName?: string };

export default function CompanyTrackingMap({ user, domain, drivers, includeBranches }: { user: User; domain: string; drivers: RegisteredDriver[]; includeBranches: boolean }) {
  const target = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const centered = useRef(false);
  const [selected, setSelected] = useState<string>();
  const { positions, unavailable } = useCompanyDriverPositions(user, domain, includeBranches);
  const driver = positions.find(position => position.uid === selected);

  useEffect(() => {
    const instance = new Map({
      target: target.current!,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: fromLonLat([-51, -15]), zoom: 4, minZoom: 2 })
    });
    map.current = instance;
    return () => {
      instance.setTarget(undefined);
      map.current = null;
      centered.current = false;
    };
  }, []);

  useCompanyVehicleLayer(map, positions, driver, setSelected);

  useEffect(() => {
    if (!positions.length || centered.current) return;
    const coordinates = positions.map(position => fromLonLat(position.position));
    const bounds = coordinates.reduce<number[]>(([west,south,east,north],[x,y]) =>
      [Math.min(x,west),Math.min(y,south),Math.max(x,east),Math.max(y,north)], [Infinity,Infinity,-Infinity,-Infinity]);
    map.current?.getView().fit(bounds, { padding: [55, 35, 55, 35], maxZoom: 14 });
    centered.current = true;
  }, [positions]);

  const liveIds = new Set(positions.map(position => position.uid));
  const withoutPosition = drivers.filter(item => !liveIds.has(item.uid));
  return <section aria-labelledby="drive-live-title" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 id="drive-live-title" className="text-sm font-bold text-[#2D3277]">Mapa de motoristas</h4>
      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">{positions.length} compartilhando agora</span>
    </div>
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 md:flex-row">
      <div ref={target} role="region" aria-label="Mapa de localização e rotas dos motoristas"
        tabIndex={0} className="h-72 min-w-0 bg-slate-50 md:h-96 md:flex-1" />
      {driver && <DriverDetails driver={driver} onClose={() => setSelected(undefined)} />}
    </div>
    {unavailable && <p role="status" className="text-xs text-rose-700">Sem atualização do mapa. Tentando reconectar.</p>}
    {!unavailable && positions.length === 0 && <p className="text-xs text-slate-600">Os veículos aparecem quando o motorista compartilha a localização no Drive.</p>}
    {(positions.length > 0 || withoutPosition.length > 0) && <ul aria-label="Localização dos motoristas" className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
      {positions.map(item => <li key={item.uid}>
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-100"
          onClick={() => {
            setSelected(item.uid);
            map.current?.getView().animate({ center: fromLonLat(item.position), zoom: 15, duration: 300 });
          }}>
          <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: vehicleColor(item.uid) }} />
          <strong>{item.name}</strong>
          <span className="ml-2 text-slate-600">{new Date(item.updatedAt).toLocaleTimeString('pt-BR')}</span>
        </button>
      </li>)}
      {withoutPosition.map(item => <li key={item.uid} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
        <strong>{item.driverName || item.email}</strong>
        <span className="ml-2 text-slate-600">Sem posição recente</span>
      </li>)}
    </ul>}
  </section>;
}
