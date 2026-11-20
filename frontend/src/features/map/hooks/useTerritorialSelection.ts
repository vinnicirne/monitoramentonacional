import type { Dispatch, SetStateAction } from 'react';
import type { SelectedFeatureData, TerritorialRegistry } from '../../../types';
import type { UfMetadataInfo } from '../../../data/brasilEstadosData';
import type { FaccaoSearchEntry } from '../../../data/faccoesPrecisas';
import type { DelegaciaTerritorialMgEs } from '../../../types/delegaciaTerritorial';
import { getSedeDelegacia } from '../../../data/delegaciaSedes';
import type { AddressSearchResult } from '../../../utils/geocoding';
import type { EstadoScope } from '../../../types/sigBase';
import type { AccessTargetInput } from '../../auth/authUtils';

function loadRiskData() {
  return import('../../../data/faccoesPrecisas').catch(error => {
    console.error('Não foi possível carregar os dados de risco territorial.', error);
    return null;
  });
}

interface TerritorialSelectionOptions {
  registry: TerritorialRegistry | null;
  estadoScope: EstadoScope;
  selectedCispId: number | null;
  selectedCommunityName: string | null;
  selectedDelegaciaMgEsId: string | null;
  setSelectedCispId: Dispatch<SetStateAction<number | null>>;
  setSelectedCommunityName: Dispatch<SetStateAction<string | null>>;
  setSelectedUf: Dispatch<SetStateAction<UfMetadataInfo | null>>;
  setSelectedData: Dispatch<SetStateAction<SelectedFeatureData | null>>;
  setIsDossierOpen: Dispatch<SetStateAction<boolean>>;
  setFocusTarget: Dispatch<SetStateAction<{ lat: number; lng: number; zoom?: number; ts: number } | null>>;
  setSelectedAddress: Dispatch<SetStateAction<(AddressSearchResult & { ts: number }) | null>>;
  requireApprovedAccess: (reason: string, action: () => void) => void;
  logLocationAccess: (target: AccessTargetInput) => Promise<void>;
  onResetView: () => void;
}

export function useTerritorialSelection({
  registry,
  estadoScope,
  selectedCispId,
  selectedCommunityName,
  selectedDelegaciaMgEsId,
  setSelectedCispId,
  setSelectedCommunityName,
  setSelectedUf,
  setSelectedData,
  setIsDossierOpen,
  setFocusTarget,
  setSelectedAddress,
  requireApprovedAccess,
  logLocationAccess,
  onResetView
}: TerritorialSelectionOptions) {
  const focusStation = (cisp: number) => {
    const station = getSedeDelegacia(cisp)?.coordenadas;
    const coordinates = station ?? registry?.cisps[cisp]?.centroide;
    if (coordinates) {
      const [lng, lat] = coordinates;
      setFocusTarget({ lat, lng, zoom: station ? 16 : 12.6, ts: Date.now() });
    }
  };

  const handleSelectCISP = (cispId: number) => {
    if (selectedCispId === cispId) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      onResetView();
      return;
    }

    requireApprovedAccess(
      `Para visualizar o dossiê completo da ${cispId}ª DP e seus indicadores, entre ou crie sua conta.`,
      () => {
        setSelectedCispId(cispId);
        setSelectedCommunityName(null);
        setSelectedUf(null);
        focusStation(cispId);
        const record = registry?.cisps[cispId];
        if (record) {
          setSelectedData({
            tipo: 'DELEGACIA', id: record.cisp, cisp: record.cisp, nome: record.nome_oficial,
            aisp: record.aisp, risp: record.risp, batalhao: record.batalhao,
            comando: record.comando_regional, municipio: record.municipio,
            bairros: record.bairros, telefone: record.telefone, endereco: record.endereco,
            marcolegal: record.marcolegal, areakm2: record.areakm2,
            indicadores: record.indicadores, dinamica_territorial: record.dinamica_territorial
          });
          setIsDossierOpen(true);
        }
        void logLocationAccess({
          targetType: 'CISP',
          targetName: record?.nome_oficial || `${cispId}ª DP`,
          uf: 'RJ', municipio: record?.municipio || '', cisp: cispId
        });
      }
    );
  };

  const handleSelectCommunity = (entry: FaccaoSearchEntry) => {
    requireApprovedAccess(
      `Para consultar os dados territoriais de "${entry.nome}", entre ou crie sua conta.`,
      async () => {
        const risk = await loadRiskData();
        if (!risk) return;
        const meta = risk.FAC_CATALOG[entry.f];
        const cispNumber = risk.findCispForCoords(entry.lng, entry.lat);
        const record = cispNumber && registry ? registry.cisps[cispNumber] : undefined;
        setSelectedCommunityName(entry.nome);
        setSelectedUf(null);
        if (cispNumber) setSelectedCispId(cispNumber);
        setSelectedData({
          tipo: 'FACCAO_COMUNIDADE', id: `dr-${entry.nome}`, nome: entry.nome,
          faccao: meta.label, faccaoCode: entry.f,
          descricao: `Polígono delimitado de "${entry.nome}" (${meta.label}) na circunscrição da ${record?.nome_oficial || (cispNumber ? `${cispNumber}ª DP` : 'Rio de Janeiro')}.`,
          fonte: 'Dados de Riscos · Mapa RJ Risco Facções', data_registro: 'Agosto/2026',
          grau_confiabilidade: 'Precisão Poligonal (1.695 áreas)',
          cisp: record?.cisp || cispNumber, aisp: record?.aisp, risp: record?.risp,
          batalhao: record?.batalhao, comando: record?.comando_regional,
          municipio: record?.municipio || 'Rio de Janeiro', bairros: record?.bairros || [],
          telefone: record?.telefone, endereco: record?.endereco, marcolegal: record?.marcolegal,
          areakm2: record?.areakm2, indicadores: record?.indicadores,
          dinamica_territorial: record?.dinamica_territorial
        });
        setIsDossierOpen(true);
        setFocusTarget({ lat: entry.lat, lng: entry.lng, zoom: 14.2, ts: Date.now() });
        void logLocationAccess({
          targetType: 'FACCAO_COMUNIDADE', targetName: `${entry.nome} (${meta.shortLabel})`,
          uf: 'RJ', municipio: record?.municipio || 'Rio de Janeiro', cisp: record?.cisp || cispNumber || 0
        });
      }
    );
  };

  const handleSelectUf = (ufInfo: UfMetadataInfo) => {
    requireApprovedAccess(
      `Para consultar o panorama territorial de ${ufInfo.nome} (${ufInfo.uf}), entre ou crie sua conta.`,
      () => {
        setSelectedUf(ufInfo);
        setSelectedCispId(null);
        setSelectedCommunityName(null);
        setSelectedData({ tipo: 'ESTADO_UF', id: ufInfo.uf, nome: ufInfo.nome, ufInfo });
        setIsDossierOpen(true);
        setFocusTarget({ lat: ufInfo.lat, lng: ufInfo.lng, zoom: ufInfo.zoom, ts: Date.now() });
        void logLocationAccess({
          targetType: 'ESTADO_UF', targetName: `${ufInfo.nome} (${ufInfo.uf})`,
          uf: ufInfo.uf, municipio: ufInfo.capital
        });
      }
    );
  };

  const handleSelectDelegaciaMgEs = (delegacia: DelegaciaTerritorialMgEs) => {
    if (selectedDelegaciaMgEsId === delegacia.id) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      onResetView();
      return;
    }

    requireApprovedAccess(
      `Para consultar o dossiê da unidade ${delegacia.nomeCurto} (${delegacia.uf}), entre ou crie sua conta.`,
      () => {
        setSelectedCispId(null);
        setSelectedCommunityName(null);
        setSelectedUf(null);
        setSelectedData({
          tipo: 'DELEGACIA_MG_ES', id: delegacia.id, nome: delegacia.nome,
          municipio: delegacia.municipio, bairros: delegacia.bairros,
          telefone: delegacia.telefone, endereco: delegacia.endereco,
          comando: `${delegacia.regional} • ${delegacia.departamentoOuRisp}`,
          delegaciaMgEs: delegacia
        });
        setIsDossierOpen(true);
        setFocusTarget({ lat: delegacia.latitude, lng: delegacia.longitude, zoom: 13.5, ts: Date.now() });
        void logLocationAccess({
          targetType: 'DELEGACIA_MG_ES', targetName: delegacia.nome,
          uf: delegacia.uf, municipio: delegacia.municipio
        });
      }
    );
  };

  const handleSelectAddress = (address: AddressSearchResult) => {
    requireApprovedAccess(
      `Para verificar a delegacia responsável e áreas de risco para "${address.shortTitle}", entre ou crie sua conta.`,
      async () => {
        const risk = await loadRiskData();
        if (!risk) return;
        const timestamp = Date.now();
        setSelectedAddress({ ...address, ts: timestamp });
        setFocusTarget({ lat: address.lat, lng: address.lng, zoom: 16.5, ts: timestamp });
        const factionMatch = risk.findFactionAtCoords(address.lng, address.lat);
        const cispNumber = risk.findCispForCoords(address.lng, address.lat);
        const record = cispNumber && registry ? registry.cisps[cispNumber] : undefined;

        if (factionMatch) {
          setSelectedCommunityName(factionMatch.nome);
          if (cispNumber) setSelectedCispId(cispNumber);
          setSelectedData({
            tipo: 'FACCAO_COMUNIDADE', id: `addr-${timestamp}`,
            nome: `${address.shortTitle} (${factionMatch.nome})`,
            faccao: factionMatch.label, faccaoCode: factionMatch.code,
            descricao: `Endereço pesquisado (${address.displayName}) localizado dentro da área "${factionMatch.nome}" (${factionMatch.label}), na circunscrição da ${record?.nome_oficial || (cispNumber ? `${cispNumber}ª DP` : 'Rio de Janeiro')}.`,
            fonte: 'OpenStreetMap Nominatim + Dados de Riscos (ago/2026)',
            data_registro: 'Agosto/2026', grau_confiabilidade: 'Geocodificação OSM + Polígono Direto',
            cisp: record?.cisp || cispNumber, aisp: record?.aisp, risp: record?.risp,
            batalhao: record?.batalhao, comando: record?.comando_regional,
            municipio: record?.municipio || 'Rio de Janeiro', bairros: record?.bairros || [],
            telefone: record?.telefone, endereco: address.displayName,
            marcolegal: record?.marcolegal, areakm2: record?.areakm2,
            indicadores: record?.indicadores, dinamica_territorial: record?.dinamica_territorial
          });
          setIsDossierOpen(true);
        } else if (record) {
          setSelectedCommunityName(null);
          setSelectedCispId(record.cisp);
          setSelectedData({
            tipo: 'CISP', id: record.cisp, cisp: record.cisp, nome: record.nome_oficial,
            aisp: record.aisp, risp: record.risp, batalhao: record.batalhao,
            comando: record.comando_regional, municipio: record.municipio,
            bairros: record.bairros, telefone: record.telefone, endereco: address.displayName,
            marcolegal: record.marcolegal, areakm2: record.areakm2,
            indicadores: record.indicadores, dinamica_territorial: record.dinamica_territorial
          });
          setIsDossierOpen(true);
        }

        void logLocationAccess({
          targetType: 'ENDERECO', targetName: address.shortTitle,
          uf: estadoScope === 'TODOS' ? 'BR' : estadoScope,
          municipio: record?.municipio || address.subtitle || '', cisp: record?.cisp || cispNumber || 0
        });
      }
    );
  };

  const handleSelectFeature = (feat: SelectedFeatureData | null) => {
    if (!feat) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      return;
    }

    const cispId = feat.cisp;
    if (cispId && selectedCispId === cispId && (feat.tipo === 'CISP' || feat.tipo === 'DELEGACIA')) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      onResetView();
      return;
    }

    if (feat.tipo === 'FACCAO_COMUNIDADE' && selectedCommunityName === feat.nome) {
      setSelectedCommunityName(null);
      setSelectedCispId(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      return;
    }

    if (feat.tipo === 'DELEGACIA_MG_ES' && selectedDelegaciaMgEsId === String(feat.id)) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      return;
    }

    const targetLabel = feat.tipo === 'CISP' || feat.tipo === 'DELEGACIA'
      ? `${feat.cisp ? `${feat.cisp}ª DP` : feat.nome}`
      : feat.nome;

    requireApprovedAccess(
      `Para consultar os detalhes de "${targetLabel}", entre ou crie sua conta.`,
      () => {
        if (feat.tipo === 'DELEGACIA_MG_ES') {
          setSelectedCispId(null);
          setSelectedCommunityName(null);
          setSelectedUf(null);
          setSelectedData(feat);
          setIsDossierOpen(true);
          void logLocationAccess({
            targetType: 'DELEGACIA_MG_ES',
            targetName: feat.nome,
            uf: feat.delegaciaMgEs?.uf || estadoScope,
            municipio: feat.municipio || ''
          });
          return;
        }

        setSelectedCommunityName(feat.tipo === 'FACCAO_COMUNIDADE' ? feat.nome : null);
        setSelectedUf(feat.tipo === 'ESTADO_UF' && feat.ufInfo ? feat.ufInfo : null);
        if (feat.tipo === 'DELEGACIA' && cispId) focusStation(cispId);
        if (cispId && registry && registry.cisps[cispId]) {
          const rec = registry.cisps[cispId];
          setSelectedData({
            ...feat,
            nome: feat.tipo === 'FACCAO_COMUNIDADE' ? feat.nome : rec.nome_oficial || feat.nome,
            bairros: rec.bairros && rec.bairros.length > 0 ? rec.bairros : feat.bairros,
            telefone: rec.telefone || feat.telefone,
            endereco: rec.endereco || feat.endereco,
            indicadores: rec.indicadores || feat.indicadores,
            dinamica_territorial: rec.dinamica_territorial || feat.dinamica_territorial
          });
          setSelectedCispId(cispId);
          void logLocationAccess({
            targetType: feat.tipo,
            targetName: feat.tipo === 'FACCAO_COMUNIDADE' ? feat.nome : rec.nome_oficial || feat.nome,
            uf: feat.ufInfo?.uf || 'RJ',
            municipio: rec.municipio || feat.municipio || '',
            cisp: cispId
          });
        } else {
          setSelectedData(feat);
          if (feat.cisp) setSelectedCispId(feat.cisp);
          void logLocationAccess({
            targetType: feat.tipo,
            targetName: feat.nome,
            uf: feat.ufInfo?.uf || (estadoScope === 'TODOS' ? 'BR' : estadoScope),
            municipio: feat.municipio || '',
            cisp: feat.cisp || 0
          });
        }
        setIsDossierOpen(true);
      }
    );
  };

  return { handleSelectFeature, handleSelectCISP, handleSelectCommunity, handleSelectUf, handleSelectDelegaciaMgEs, handleSelectAddress };
}
