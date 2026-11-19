import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import Map from 'ol/Map';
import { unByKey } from 'ol/Observable';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control/defaults';
import Feature from 'ol/Feature';
import type { TerritorialRegistry, LayerVisibility, ChoroplethMetric, SelectedFeatureData, BasemapType } from '../../../types';
import type { EstadoScope } from '../../../types/sigBase';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import type { MapFeaturePopupData } from '../components/MapFeaturePopup';
import type { MapHoverTooltipData } from '../components/MapHoverTooltip';
import { createMapLayerBundle } from '../services/mapLayerFactory';
import { bindMapFeatureClick } from '../services/mapFeatureClick';
import { bindMapPointerMove } from '../services/mapPointerMove';

interface OpenLayersMapOptions {
  mapElement: MutableRefObject<HTMLDivElement | null>;
  mapInstance: MutableRefObject<Map | null>;
  mapRefOut?: MutableRefObject<Map | null>;
  basemap: BasemapType;
  layers: LayerVisibility;
  sources: {
    brasil: VectorSource;
    preciseFactions: VectorSource;
    mgEs: VectorSource;
    address: VectorSource;
    userLocation: VectorSource;
    corporateIncidents: VectorSource;
  };
  basemapOsmRef: MutableRefObject<TileLayer<OSM> | null>;
  basemapVoyagerRef: MutableRefObject<TileLayer<XYZ> | null>;
  basemapSatRef: MutableRefObject<TileLayer<XYZ> | null>;
  basemapStreetsRef: MutableRefObject<TileLayer<XYZ> | null>;
  brasilVectorRef: MutableRefObject<VectorLayer<any> | null>;
  rispVectorRef: MutableRefObject<VectorLayer<any> | null>;
  aispVectorRef: MutableRefObject<VectorLayer<any> | null>;
  cispVectorRef: MutableRefObject<VectorLayer<any> | null>;
  faccoesPrecisasVectorRef: MutableRefObject<VectorLayer<any> | null>;
  focosVectorRef: MutableRefObject<VectorLayer<any> | null>;
  delegaciasVectorRef: MutableRefObject<VectorLayer<any> | null>;
  batalhoesVectorRef: MutableRefObject<VectorLayer<any> | null>;
  mgEsVectorRef: MutableRefObject<VectorLayer<any> | null>;
  addressVectorRef: MutableRefObject<VectorLayer<any> | null>;
  userLocVectorRef: MutableRefObject<VectorLayer<any> | null>;
  corporateHeatmapRef: MutableRefObject<any>;
  corporatePinsRef: MutableRefObject<VectorLayer<any> | null>;
  selectedCispIdRef: MutableRefObject<number | null>;
  selectedCommunityRef: MutableRefObject<string | null>;
  selectedDelegaciaIdRef: MutableRefObject<string | null>;
  choroplethMetricRef: MutableRefObject<ChoroplethMetric>;
  layerOpacityRef: MutableRefObject<number>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  selectedFactionFilterRef: MutableRefObject<string>;
  estadoScopeRef: MutableRefObject<EstadoScope>;
  onSelectFeatureRef: MutableRefObject<(feature: SelectedFeatureData | null) => void>;
  onResetViewRef: MutableRefObject<(() => void) | undefined>;
  canViewDetailsRef: MutableRefObject<boolean>;
  followUserRef: MutableRefObject<boolean>;
  setFollowUser: Dispatch<SetStateAction<boolean>>;
  onSelectCorporateIncidentRef: MutableRefObject<((incident: CorporatePackageIncident) => void) | undefined>;
  hoveredFacFeatureRef: MutableRefObject<Feature | null>;
  overlayContainerRef: MutableRefObject<HTMLDivElement | null>;
  popupOverlayRef: MutableRefObject<Overlay | null>;
  setMapPopup: Dispatch<SetStateAction<MapFeaturePopupData | null>>;
  setTooltip: Dispatch<SetStateAction<MapHoverTooltipData>>;
}

export function useOpenLayersMap(options: OpenLayersMapOptions) {
  const {
    mapElement, mapInstance, mapRefOut, basemap, layers, sources,
    basemapOsmRef, basemapVoyagerRef, basemapSatRef, basemapStreetsRef,
    brasilVectorRef, rispVectorRef, aispVectorRef, cispVectorRef,
    faccoesPrecisasVectorRef, focosVectorRef, delegaciasVectorRef, batalhoesVectorRef,
    mgEsVectorRef, addressVectorRef, userLocVectorRef, corporateHeatmapRef, corporatePinsRef,
    selectedCispIdRef, selectedCommunityRef, selectedDelegaciaIdRef, choroplethMetricRef,
    layerOpacityRef, registryRef, selectedFactionFilterRef, estadoScopeRef,
    onSelectFeatureRef, onResetViewRef, canViewDetailsRef, followUserRef, setFollowUser,
    onSelectCorporateIncidentRef, hoveredFacFeatureRef, overlayContainerRef, popupOverlayRef,
    setMapPopup, setTooltip
  } = options;

  useEffect(() => {
    if (!mapElement.current) return;

    const mapLayers = createMapLayerBundle({
      basemap,
      layers,
      sources,
      selectedCispIdRef,
      layerOpacityRef,
      choroplethMetricRef,
      registryRef,
      selectedFactionFilterRef
    });
    basemapOsmRef.current = mapLayers.basemaps.osm;
    basemapVoyagerRef.current = mapLayers.basemaps.voyager;
    basemapSatRef.current = mapLayers.basemaps.satellite;
    basemapStreetsRef.current = mapLayers.basemaps.streets;
    brasilVectorRef.current = mapLayers.vectors.brasil;
    rispVectorRef.current = mapLayers.vectors.risp;
    aispVectorRef.current = mapLayers.vectors.aisp;
    cispVectorRef.current = mapLayers.vectors.cisp;
    faccoesPrecisasVectorRef.current = mapLayers.vectors.preciseFactions;
    focosVectorRef.current = mapLayers.vectors.focos;
    delegaciasVectorRef.current = mapLayers.vectors.delegacias;
    batalhoesVectorRef.current = mapLayers.vectors.batalhoes;
    mgEsVectorRef.current = mapLayers.vectors.mgEs;
    addressVectorRef.current = mapLayers.vectors.address;
    userLocVectorRef.current = mapLayers.vectors.userLocation;
    corporateHeatmapRef.current = mapLayers.corporateHeatmap;
    corporatePinsRef.current = mapLayers.vectors.corporatePins;

    const view = new View({
      center: fromLonLat([-43.28, -22.86]),
      zoom: 10.3,
      minZoom: 3.5,
      maxZoom: 19
    });

    const map = new Map({
      target: mapElement.current,
      layers: mapLayers.orderedLayers,
      view,
      controls: defaultControls({ zoom: true, attribution: true })
    });

    mapInstance.current = map;
    if (mapRefOut) mapRefOut.current = map;
    const clickListenerKey = bindMapFeatureClick(map, {
      selectedDelegaciaIdRef,
      selectedCispIdRef,
      selectedCommunityRef,
      mgEsVectorRef,
      cispVectorRef,
      registryRef,
      canViewDetailsRef,
      onSelectFeatureRef,
      onResetViewRef,
      onSelectCorporateIncidentRef,
      popupOverlayRef,
      setMapPopup
    });

    // Pause GPS auto-follow if the user drags the map manually
    map.on('pointerdrag', () => {
      if (followUserRef.current) {
        setFollowUser(false);
      }
    });

    if (overlayContainerRef.current) {
      const overlay = new Overlay({
        element: overlayContainerRef.current,
        positioning: 'bottom-center',
        offset: [0, -12],
        autoPan: {
          animation: { duration: 250 }
        }
      });
      map.addOverlay(overlay);
      popupOverlayRef.current = overlay;
    }

    const hoverListenerKey = bindMapPointerMove(map, {
      mapElement,
      canViewDetailsRef,
      estadoScopeRef,
      hoveredFacFeatureRef,
      cispVectorRef,
      registryRef,
      setTooltip
    });

    const resizeObserver = new ResizeObserver(() => map.updateSize());
    if (mapElement.current) resizeObserver.observe(mapElement.current);
    setTimeout(() => map.updateSize(), 150);

    return () => {
      resizeObserver.disconnect();
      unByKey(clickListenerKey);
      unByKey(hoverListenerKey);
      if (popupOverlayRef.current) {
        map.removeOverlay(popupOverlayRef.current);
        popupOverlayRef.current = null;
      }
      map.setTarget(undefined);
    };
  }, []);

}
