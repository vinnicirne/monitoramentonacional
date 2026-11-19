import type { LayerVisibility } from '../../../types';
import type { EstadoScope } from '../../../types/sigBase';

export interface VisibilityLayer {
  setVisible(visible: boolean): void;
}

export interface TerritorialLayerRefs {
  brasil?: VisibilityLayer | null;
  risp?: VisibilityLayer | null;
  aisp?: VisibilityLayer | null;
  cisp?: VisibilityLayer | null;
  faccoesPrecisas?: VisibilityLayer | null;
  focos?: VisibilityLayer | null;
  delegacias?: VisibilityLayer | null;
  batalhoes?: VisibilityLayer | null;
  mgEs?: VisibilityLayer | null;
}

export function syncCorporateLayerVisibility(
  heatmap: VisibilityLayer | null,
  incidentPins: VisibilityLayer | null,
  showHeatmap: boolean,
  showIncidentPins: boolean
) {
  heatmap?.setVisible(showHeatmap);
  incidentPins?.setVisible(showIncidentPins);
}

export function syncTerritorialLayerVisibility(
  layers: LayerVisibility,
  estadoScope: EstadoScope,
  refs: TerritorialLayerRefs
) {
  const showRj = estadoScope === 'RJ' || estadoScope === 'TODOS';
  const showMgEsNodes = estadoScope !== 'RJ';
  const showBrazil = estadoScope === 'TODOS' || layers.brasilEstados;

  refs.brasil?.setVisible(showBrazil);
  refs.risp?.setVisible(showRj && layers.risp);
  refs.aisp?.setVisible(showRj && layers.aisp);
  refs.cisp?.setVisible(showRj && layers.cisp);
  refs.faccoesPrecisas?.setVisible(showRj && layers.faccoesPrecisas);
  refs.focos?.setVisible(showRj && layers.focos);
  refs.delegacias?.setVisible(showRj && layers.delegacias);
  refs.batalhoes?.setVisible(showRj && layers.batalhoes);
  refs.mgEs?.setVisible(showMgEsNodes && layers.mgEs);
}
