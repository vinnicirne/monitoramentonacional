import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type Map from 'ol/Map';
import type Overlay from 'ol/Overlay';
import type VectorLayer from 'ol/layer/Vector';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { TerritorialRegistry, SelectedFeatureData } from '../../../types';
import type { DelegaciaTerritorialMgEs } from '../../../types/delegaciaTerritorial';
import type { CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import { FAC_CATALOG, findCispForCoords, getPolygonCentroid } from '../../../data/faccoesPrecisas';
import { BRASIL_UFS_INFO } from '../../../data/brasilEstadosData';
import type { MapFeaturePopupData } from '../components/MapFeaturePopup';

interface MapFeatureClickOptions {
  selectedDelegaciaIdRef: MutableRefObject<string | null>;
  selectedCispIdRef: MutableRefObject<number | null>;
  selectedCommunityRef: MutableRefObject<string | null>;
  mgEsVectorRef: MutableRefObject<VectorLayer<any> | null>;
  cispVectorRef: MutableRefObject<VectorLayer<any> | null>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  canViewDetailsRef: MutableRefObject<boolean>;
  onSelectFeatureRef: MutableRefObject<(data: SelectedFeatureData | null) => void>;
  onResetViewRef: MutableRefObject<(() => void) | undefined>;
  onSelectCorporateIncidentRef: MutableRefObject<((incident: CorporatePackageIncident) => void) | undefined>;
  popupOverlayRef: MutableRefObject<Overlay | null>;
  setMapPopup: Dispatch<SetStateAction<MapFeaturePopupData | null>>;
}

export function bindMapFeatureClick(map: Map, {
  selectedDelegaciaIdRef, selectedCispIdRef, selectedCommunityRef, mgEsVectorRef,
  cispVectorRef, registryRef, canViewDetailsRef, onSelectFeatureRef, onResetViewRef,
  onSelectCorporateIncidentRef, popupOverlayRef, setMapPopup
}: MapFeatureClickOptions) {
    // Click handler
  const clickListenerKey = map.on('singleclick', evt => {
      let featureFound = false;
      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (featureFound) return true;
        const props = feature.getProperties();
        const tipo = props.tipo || props.type;

        if (tipo === 'DELEGACIA_MG_ES_POLYGON' || tipo === 'DELEGACIA_MG_ES') {
          featureFound = true;
          const del = props.delegacia as DelegaciaTerritorialMgEs;
          if (selectedDelegaciaIdRef.current === del.id) {
            selectedDelegaciaIdRef.current = null;
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            if (mgEsVectorRef.current) mgEsVectorRef.current.changed();
            onResetViewRef.current?.();
            return true;
          }

          if (canViewDetailsRef.current) {
            selectedDelegaciaIdRef.current = del.id;
            if (mgEsVectorRef.current) mgEsVectorRef.current.changed();

            setMapPopup({
              visible: true,
              title: del.nomeCurto,
              factionLabel: `${del.orgao} · ${del.municipio} - ${del.uf}`,
              factionShort: del.orgao,
              color: del.cor,
              cispLabel: del.regional,
              source: `${del.totalBairros} Bairros atendidos · Comarca de ${del.municipio}`,
              period: del.plantao24h ? 'Atendimento: Plantão 24 Horas' : del.horarioAtendimento,
              methodologyNote: `Jurisdição: ${del.jurisdicao} | Endereço: ${del.endereco} | Tel: ${del.telefone}`
            });
            popupOverlayRef.current?.setPosition(evt.coordinate);
          }

          onSelectFeatureRef.current({
            tipo: 'DELEGACIA_MG_ES',
            id: del.id,
            nome: del.nome,
            municipio: del.municipio,
            bairros: del.bairros,
            telefone: del.telefone,
            endereco: del.endereco,
            comando: `${del.regional} • ${del.departamentoOuRisp}`,
            delegaciaMgEs: del
          });
          return true;
        }

        if (tipo === 'MGES_NODE') {
          featureFound = true;
          setMapPopup(null);
          popupOverlayRef.current?.setPosition(undefined);
          onSelectFeatureRef.current({
            tipo: 'MGES_NODE',
            id: props.mgEsInfo.titulo,
            nome: props.mgEsInfo.titulo,
            mgEsInfo: props.mgEsInfo
          });
          return true;
        }

        if (tipo === 'CORPORATE_INCIDENT') {
          featureFound = true;
          const inc = props.incident as CorporatePackageIncident;
          if (onSelectCorporateIncidentRef.current) {
            onSelectCorporateIncidentRef.current(inc);
            return true;
          }
        }

        if (tipo === 'FACCAO_PRECISA') {
          featureFound = true;
          const nome = props.n as string;
          if (selectedCommunityRef.current === nome) {
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            onResetViewRef.current?.();
            return true;
          }
          const code = props.f as CodigoFaccaoPrecisa;
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          const origRing = props.origRing as [number, number][];
          const [cx, cy] = origRing?.length ? getPolygonCentroid(origRing) : [-43.28, -22.86];
          const cispFeatAtClick = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(evt.coordinate)?.[0];
          const cispNum = (cispFeatAtClick?.get('cisp') as number | undefined) ?? findCispForCoords(cx, cy);
          const reg = registryRef.current;
          const regRecord = cispNum ? reg?.cisps[cispNum] : undefined;

          if (canViewDetailsRef.current) {
            setMapPopup({
              visible: true,
              title: nome,
              factionLabel: meta.label,
              factionShort: meta.shortLabel,
              color: meta.color,
              cispLabel: regRecord?.nome_oficial || (cispNum ? `${cispNum}ª DP` : undefined),
              source: 'Dados de Riscos · Mapa RJ Risco Facções',
              sourceUrl: 'https://dadosderiscos.com.br/mapa-rj-risco-faccoes.html',
              period: 'Base Agosto/2026 (1.695 áreas)',
              methodologyNote: 'Mapeamento comunitário compilado a partir de fontes públicas (GENI-UFF, Fogo Cruzado e Disque-Denúncia).'
            });
            popupOverlayRef.current?.setPosition(evt.coordinate);
          }

          onSelectFeatureRef.current({
            tipo: 'FACCAO_COMUNIDADE',
            id: `dr-${nome}`,
            nome,
            faccao: meta.label,
            faccaoCode: code,
            descricao: `Polígono delimitado de "${nome}" (${meta.label}) na circunscrição da ${
              regRecord?.nome_oficial || (cispNum ? `${cispNum}ª DP` : 'Região Metropolitana RJ')
            }.`,
            fonte: 'Dados de Riscos (dadosderiscos.com.br) · GENI-UFF / Fogo Cruzado',
            data_registro: 'Agosto/2026',
            grau_confiabilidade: 'Precisão Poligonal (1.695 áreas)',
            cisp: regRecord?.cisp || cispNum,
            aisp: regRecord?.aisp,
            risp: regRecord?.risp,
            batalhao: regRecord?.batalhao,
            comando: regRecord?.comando_regional,
            municipio: regRecord?.municipio || 'Rio de Janeiro',
            bairros: regRecord?.bairros || [],
            telefone: regRecord?.telefone,
            endereco: regRecord?.endereco,
            marcolegal: regRecord?.marcolegal,
            areakm2: regRecord?.areakm2,
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'FOCO_ESPECIAL') {
          featureFound = true;
          if (canViewDetailsRef.current) {
            setMapPopup({
              visible: true,
              title: props.nome,
              factionLabel: props.faccao || 'Foco Especial',
              factionShort: props.grupoArmado || 'FOCO',
              color: props.cor || '#ef4444',
              cispLabel: props.cisp ? `${props.cisp}ª DP` : undefined,
              source: props.fonte || 'Registros Públicos Consolidados',
              period: props.data_registro || 'Atualizado 2026',
              methodologyNote: props.detalhes || props.descricao || props.grau_confiabilidade || 'Registro georreferenciado KML / fontes públicas.'
            });
            popupOverlayRef.current?.setPosition(evt.coordinate);
          }

          onSelectFeatureRef.current({
            tipo: 'FOCO_ESPECIAL',
            id: feature.getId() || props.id || 'foco',
            nome: props.nome,
            municipio: props.municipio,
            faccao: props.faccao,
            descricao: props.descricao || props.detalhes,
            fonte: props.fonte,
            data_registro: props.data_registro,
            grau_confiabilidade: props.grau_confiabilidade,
            alerta_juridico: props.alerta_juridico,
            aisp: props.aisp,
            cisp: props.cisp
          });
          return true;
        }

        if (tipo === 'CISP') {
          featureFound = true;
          const cispNum = Number(props.cisp);
          if (selectedCispIdRef.current !== null && Number(selectedCispIdRef.current) === cispNum) {
            selectedCispIdRef.current = null;
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            onResetViewRef.current?.();
            return true;
          }
          const reg = registryRef.current;
          const regRecord = reg?.cisps[cispNum];
          let bairrosList = regRecord?.bairros;
          if (!bairrosList || bairrosList.length === 0) {
            if (typeof props.bairros === 'string') {
              bairrosList = props.bairros.split(',').map((s: string) => s.trim());
            } else if (Array.isArray(props.bairros)) {
              bairrosList = props.bairros;
            }
          }
          onSelectFeatureRef.current({
            tipo: 'CISP',
            id: cispNum,
            cisp: cispNum,
            nome: regRecord?.nome_oficial || props.nome,
            aisp: props.aisp,
            risp: props.risp,
            batalhao: props.batalhao,
            municipio: props.municipio,
            bairros: bairrosList || [],
            telefone: regRecord?.telefone || '',
            endereco: regRecord?.endereco || '',
            marcolegal: props.marcolegal,
            areakm2: props.areakm2,
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'AISP') {
          featureFound = true;
          const aispNum = props.aisp;
          onSelectFeatureRef.current({
            tipo: 'AISP',
            id: aispNum,
            aisp: aispNum,
            nome: props.nome,
            risp: props.risp,
            municipio: props.municipio,
            batalhao: props.batalhao,
            endereco: props.endereco,
            areakm2: props.areakm2
          });
          return true;
        }

        if (tipo === 'RISP') {
          featureFound = true;
          onSelectFeatureRef.current({
            tipo: 'RISP',
            id: props.id,
            risp: props.id,
            nome: props.nome,
            comando: props.cpa,
            areakm2: props.areakm2
          });
          return true;
        }

        if (tipo === 'DELEGACIA') {
          featureFound = true;
          const cispNum = Number(props.cisp);
          if (selectedCispIdRef.current !== null && Number(selectedCispIdRef.current) === cispNum) {
            selectedCispIdRef.current = null;
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            onResetViewRef.current?.();
            return true;
          }
          const regRecord = registryRef.current?.cisps[cispNum];
          onSelectFeatureRef.current({
            tipo: 'DELEGACIA',
            id: cispNum,
            cisp: cispNum,
            nome: regRecord?.nome_oficial || props.nome,
            batalhao: props.batalhao,
            municipio: props.municipio,
            endereco: regRecord?.endereco || props.endereco,
            telefone: regRecord?.telefone || props.telefone,
            bairros: regRecord?.bairros || [],
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'BATALHAO') {
          featureFound = true;
          onSelectFeatureRef.current({
            tipo: 'BATALHAO',
            id: props.aisp,
            aisp: props.aisp,
            nome: props.nome,
            municipio: props.municipio,
            endereco: props.endereco,
            risp: props.risp
          });
          return true;
        }

        if (tipo === 'BRASIL_UF') {
          featureFound = true;
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo) {
            onSelectFeatureRef.current({
              tipo: 'ESTADO_UF',
              id: ufInfo.uf,
              nome: ufInfo.nome,
              ufInfo
            });
          }
          return true;
        }

        return false;
      });

      if (!featureFound) {
        setMapPopup(null);
        popupOverlayRef.current?.setPosition(undefined);
        if (selectedCispIdRef.current || selectedCommunityRef.current || selectedDelegaciaIdRef.current) {
          selectedDelegaciaIdRef.current = null;
          onSelectFeatureRef.current(null);
          if (mgEsVectorRef.current) mgEsVectorRef.current.changed();
        }
      }
  });
  return clickListenerKey;
}
