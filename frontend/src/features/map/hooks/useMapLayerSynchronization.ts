import { useEffect, type MutableRefObject } from 'react';
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
import { createCorporateIncidentFeatures } from '../services/corporateIncidentFeatures';
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
    syncCorporateLayerVisibility(
      corporateHeatmapRef.current,
      corporatePinsRef.current,
      layers.corporateHeatmap !== false,
      layers.corporateIncidents !== false
    );
  }, [layers.corporateHeatmap, layers.corporateIncidents]);
}
