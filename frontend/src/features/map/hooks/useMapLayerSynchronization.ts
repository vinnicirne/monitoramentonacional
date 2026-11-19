import { useEffect, type MutableRefObject } from 'react';
import { unByKey } from 'ol/Observable';
import { get as getProjection } from 'ol/proj';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { LayerVisibility } from '../../../types';
import type { DivisaoTerritorialRow, EstadoScope, UnidadePolicialRow } from '../../../types/sigBase';
import type { UfMetadataInfo } from '../../../data/brasilEstadosData';
import type { CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import { syncCorporateLayerVisibility, syncTerritorialLayerVisibility } from '../services/layerVisibility';
import { createBrazilStateFeatures } from '../services/brazilStateFeatures';
import { populatePreciseFactionLayer } from '../services/preciseFactionLayer';
import { createMgEsFeatures } from '../services/mgEsFeatures';
import { createCorporateIncidentFeatures, createCorporateIncidentMarkers } from '../services/corporateIncidentFeatures';
import { getFactionStyle } from '../factionStyles';

interface MapLayerSynchronizationOptions {
  layers: LayerVisibility;
  estadoScope: EstadoScope;
  selectedUf?: UfMetadataInfo | null;
  visiblePreciseFactions: Record<CodigoFaccaoPrecisa, boolean>;
  selectedFactionFilter: string;
  mgEsDivisao: DivisaoTerritorialRow[];
  mgEsUnidades: UnidadePolicialRow[];
  companyIncidents: CorporatePackageIncident[];
  brasilSource: VectorSource;
  brasilLayerRef: MutableRefObject<VectorLayer<any> | null>;
  preciseFactionSource: VectorSource;
  preciseFactionLayerRef: MutableRefObject<VectorLayer<any> | null>;
  mgEsSource: VectorSource;
  mgEsLayerRef: MutableRefObject<VectorLayer<any> | null>;
  corporateIncidentSource: VectorSource;
  corporateHeatmapRef: MutableRefObject<any>;
  corporatePinsRef: MutableRefObject<VectorLayer<any> | null>;
  rispLayerRef: MutableRefObject<VectorLayer<any> | null>;
  aispLayerRef: MutableRefObject<VectorLayer<any> | null>;
  cispLayerRef: MutableRefObject<VectorLayer<any> | null>;
  focosLayerRef: MutableRefObject<VectorLayer<any> | null>;
  delegaciasLayerRef: MutableRefObject<VectorLayer<any> | null>;
  batalhoesLayerRef: MutableRefObject<VectorLayer<any> | null>;
  selectedCommunityRef: MutableRefObject<string | null>;
  selectedDelegaciaIdRef: MutableRefObject<string | null>;
}

export function useMapLayerSynchronization({
  layers,
  estadoScope,
  selectedUf,
  visiblePreciseFactions,
  selectedFactionFilter,
  mgEsDivisao,
  mgEsUnidades,
  companyIncidents,
  brasilSource,
  brasilLayerRef,
  preciseFactionSource,
  preciseFactionLayerRef,
  mgEsSource,
  mgEsLayerRef,
  corporateIncidentSource,
  corporateHeatmapRef,
  corporatePinsRef,
  rispLayerRef,
  aispLayerRef,
  cispLayerRef,
  focosLayerRef,
  delegaciasLayerRef,
  batalhoesLayerRef,
  selectedCommunityRef,
  selectedDelegaciaIdRef
}: MapLayerSynchronizationOptions) {
  const showCorporateMarkers = layers.corporateIncidents !== false;

  useEffect(() => {
    syncTerritorialLayerVisibility(layers, estadoScope, {
      brasil: brasilLayerRef.current,
      risp: rispLayerRef.current,
      aisp: aispLayerRef.current,
      cisp: cispLayerRef.current,
      faccoesPrecisas: preciseFactionLayerRef.current,
      focos: focosLayerRef.current,
      delegacias: delegaciasLayerRef.current,
      batalhoes: batalhoesLayerRef.current,
      mgEs: mgEsLayerRef.current
    });
  }, [layers, estadoScope]);

  useEffect(() => {
    brasilSource.clear();
    brasilSource.addFeatures(createBrazilStateFeatures(estadoScope, selectedUf));
  }, [brasilSource, estadoScope, selectedUf]);

  useEffect(() => {
    populatePreciseFactionLayer({
      source: preciseFactionSource,
      layer: preciseFactionLayerRef.current,
      visibleFactions: visiblePreciseFactions,
      selectedFactionFilter,
      getSelectedCommunity: () => selectedCommunityRef.current,
      getFactionStyle
    });
  }, [preciseFactionSource, visiblePreciseFactions, selectedFactionFilter]);

  useEffect(() => {
    mgEsSource.clear();
    mgEsSource.addFeatures(createMgEsFeatures({
      estadoScope,
      divisao: mgEsDivisao,
      unidades: mgEsUnidades,
      selectedDelegaciaId: () => selectedDelegaciaIdRef.current
    }));
  }, [mgEsSource, estadoScope, mgEsDivisao, mgEsUnidades]);

  useEffect(() => {
    corporateIncidentSource.clear();
    if (companyIncidents.length > 0) {
      corporateIncidentSource.addFeatures(createCorporateIncidentFeatures(companyIncidents));
    }
  }, [corporateIncidentSource, companyIncidents]);

  useEffect(() => {
    const cispSource = cispLayerRef.current?.getSource();
    const markerSource = corporatePinsRef.current?.getSource();
    if (!cispSource || !markerSource) return;

    const points = corporateIncidentSource.getFeatures();
    markerSource.clear(true);
    if (!showCorporateMarkers || points.length === 0) return;

    const updateMarkers = () => {
      markerSource.clear(true);
      markerSource.addFeatures(createCorporateIncidentMarkers(points, cispSource, mgEsSource));
    };
    const listener = cispSource.on('featuresloadend', updateMarkers);
    updateMarkers();

    const projection = getProjection('EPSG:3857');
    if (projection) cispSource.loadFeatures(projection.getExtent(), 1, projection);
    return () => unByKey(listener);
  }, [
    cispLayerRef, corporatePinsRef, corporateIncidentSource, companyIncidents,
    mgEsSource, estadoScope, mgEsDivisao, mgEsUnidades, showCorporateMarkers
  ]);

  useEffect(() => {
    syncCorporateLayerVisibility(
      corporateHeatmapRef.current,
      corporatePinsRef.current,
      layers.corporateHeatmap !== false,
      showCorporateMarkers
    );
  }, [layers.corporateHeatmap, showCorporateMarkers]);
}
