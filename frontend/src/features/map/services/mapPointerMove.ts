import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type Map from 'ol/Map';
import type Feature from 'ol/Feature';
import type VectorLayer from 'ol/layer/Vector';
import type { TerritorialRegistry } from '../../../types';
import type { EstadoScope } from '../../../types/sigBase';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { DelegaciaTerritorialMgEs } from '../../../types/delegaciaTerritorial';
import type { CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import { FAC_CATALOG } from '../../../data/faccoesPrecisas';
import { BRASIL_UFS_INFO } from '../../../data/brasilEstadosData';
import { INCIDENT_TYPE_META } from '../../../utils/corporateIncidentMetadata';
import { getFactionStyle } from '../factionStyles';
import type { MapHoverTooltipData } from '../components/MapHoverTooltip';
import type { CorporateIncidentGroup } from './corporateIncidentFeatures';

interface MapHoverOptions {
  mapElement: MutableRefObject<HTMLDivElement | null>;
  canViewDetailsRef: MutableRefObject<boolean>;
  estadoScopeRef: MutableRefObject<EstadoScope>;
  hoveredFacFeatureRef: MutableRefObject<Feature | null>;
  cispVectorRef: MutableRefObject<VectorLayer<any> | null>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  setTooltip: Dispatch<SetStateAction<MapHoverTooltipData>>;
}

export function bindMapPointerMove(map: Map, {
  mapElement,
  canViewDetailsRef,
  estadoScopeRef,
  hoveredFacFeatureRef,
  cispVectorRef,
  registryRef,
  setTooltip
}: MapHoverOptions) {
  return map.on('pointermove', evt => {
      if (evt.dragging || (evt.originalEvent as PointerEvent | undefined)?.pointerType === 'touch') {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }

      if (hoveredFacFeatureRef.current) {
        hoveredFacFeatureRef.current.setStyle(undefined);
        hoveredFacFeatureRef.current = null;
      }

      const mapW = mapElement.current?.clientWidth || 1000;
      const mapH = mapElement.current?.clientHeight || 700;
      const safeX = Math.min(evt.pixel[0] + 14, Math.max(12, mapW - 330));
      const safeY = Math.min(evt.pixel[1] + 14, Math.max(12, mapH - 165));

      let hit = false;
      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (hit) return true;
        const props = feature.getProperties();
        const tipo = props.tipo || props.type;

        if (!canViewDetailsRef.current) {
          if (
            tipo === 'DELEGACIA_MG_ES_POLYGON' ||
            tipo === 'DELEGACIA_MG_ES' ||
            tipo === 'FACCAO_PRECISA' ||
            tipo === 'FOCO_ESPECIAL' ||
            tipo === 'MGES_NODE' ||
            (tipo === 'BRASIL_UF' && estadoScopeRef.current === 'TODOS') ||
            props.nome ||
            props.cisp_formatado
          ) {
            hit = true;
            const title =
              tipo === 'DELEGACIA_MG_ES_POLYGON' || tipo === 'DELEGACIA_MG_ES'
                ? (props.delegacia as DelegaciaTerritorialMgEs)?.nomeCurto || 'Delegacia Territorial'
                : tipo === 'FACCAO_PRECISA'
                ? String(props.n || 'Área Mapeada')
                : props.cisp_formatado
                ? `${props.cisp_formatado}`
                : String(props.nome || 'Localização no Mapa');
            setTooltip({
              visible: true,
              x: safeX,
              y: safeY,
              title,
              sub: 'Clique para entrar ou criar conta e ver o dossiê completo',
              type: 'ACESSO RESTRITO',
              color: '#3483FA'
            });
            return true;
          }
          return false;
        }

        if (tipo === 'DELEGACIA_MG_ES_POLYGON' || tipo === 'DELEGACIA_MG_ES') {
          hit = true;
          const del = props.delegacia as DelegaciaTerritorialMgEs;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: del.nomeCurto,
            sub: `${del.municipio} - ${del.uf} • ${del.totalBairros} Bairros na Jurisdição`,
            type: `DELEGACIA · ${del.orgao} (${del.uf})`,
            color: del.cor,
            source: del.jurisdicao,
            sourceDetail: `Principais Bairros: ${del.bairros.slice(0, 5).join(', ')}${del.bairros.length > 5 ? '...' : ''}`
          });
          return true;
        }

        if (tipo === 'MGES_NODE') {
          hit = true;
          const info = props.mgEsInfo;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: `${info.uf} · ${info.titulo}`,
            sub: info.subtitulo,
            type: 'SIG MG·ES',
            source: info.divisao?.Fonte_Legal || info.unidade?.Fonte_Legal || 'SEJUSP-MG / SESP-ES'
          });
          return true;
        }

        if (tipo === 'CORPORATE_INCIDENT_GROUP') {
          hit = true;
          const { areaName, incidents } = props.group as CorporateIncidentGroup;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: areaName,
            sub: incidents.length === 1 ? '1 ocorrência na área' : `${incidents.length} ocorrências na área`,
            type: 'OCORRÊNCIAS'
          });
          return true;
        }

        if (tipo === 'CORPORATE_INCIDENT') {
          hit = true;
          const inc = props.incident as CorporatePackageIncident;
          const meta = INCIDENT_TYPE_META[inc.incidentType] || INCIDENT_TYPE_META.outros;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: `[${meta.label}] ${inc.trackingCode}`,
            sub: `${inc.delegaciaName} · B.O. ${inc.boNumber || 'S/N'}${inc.estimatedValue ? ` · R$ ${inc.estimatedValue.toLocaleString('pt-BR')}` : ''}`,
            type: `OCORRÊNCIA @${inc.companyDomain}`,
            color: meta.isRoubo ? '#dc2626' : '#ea580c',
            source: 'Ocorrência Confidencial da Empresa',
            sourceDetail: 'Visível exclusivamente para colaboradores homologados'
          });
          return true;
        }

        if (tipo === 'FACCAO_PRECISA') {
          hit = true;
          const code = props.f as CodigoFaccaoPrecisa;
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          hoveredFacFeatureRef.current = feature as Feature;
          (feature as Feature).setStyle(getFactionStyle(code, true));

          const cispFeatAtHover = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(evt.coordinate)?.[0];
          const cispNum = cispFeatAtHover?.get('cisp') as number | undefined;
          const regRecord = cispNum ? registryRef.current?.cisps[cispNum] : undefined;
          const cispText = regRecord
            ? `${regRecord.cisp_formatado} (${regRecord.municipio})`
            : cispNum
            ? `${cispNum}ª DP`
            : '';

          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: props.n,
            sub: cispText ? `${meta.label} · ${cispText}` : meta.label,
            type: `FACÇÃO · ${meta.shortLabel}`,
            color: meta.color,
            source: 'Dados de Riscos (dadosderiscos.com.br)',
            sourceDetail: 'Mapa RJ Risco Facções · Base ago/2026 (GENI-UFF / Fogo Cruzado)'
          });
          return true;
        }

        if (tipo === 'FOCO_ESPECIAL') {
          hit = true;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: props.nome,
            sub: props.faccao
              ? `${props.faccao}${props.situacao ? ` · ${props.situacao}` : ''}`
              : 'Área de Foco Especial',
            type: 'FOCO ESPECIAL',
            color: props.cor || '#ef4444',
            source: props.fonte || 'Fontes Públicas Consolidadas',
            sourceDetail: `${props.municipio ? `${props.municipio} · ` : ''}${props.data_registro || ''}${props.grau_confiabilidade ? ` · ${props.grau_confiabilidade}` : ''}`
          });
          return true;
        }

        if (tipo === 'BRASIL_UF' && estadoScopeRef.current === 'TODOS') {
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo) {
            hit = true;
            setTooltip({
              visible: true,
              x: safeX,
              y: safeY,
              title: `${ufInfo.nome} (${ufInfo.uf})`,
              sub: `Região ${ufInfo.regiao} · Capital: ${ufInfo.capital}`,
              type: 'ESTADO (IBGE)',
              source: 'Malha Oficial IBGE'
            });
            return true;
          }
        }

        if (tipo === 'DELEGACIA') {
          hit = true;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: props.nome,
            sub: props.endereco,
            type: 'SEDE DA DP'
          });
          return true;
        }

        if (props.nome || props.cisp_formatado) {
          hit = true;
          const cispNum = props.cisp as number | undefined;
          const regRecord = cispNum ? registryRef.current?.cisps[cispNum] : undefined;
          const din = regRecord?.dinamica_territorial;
          const title = props.cisp_formatado ? `${props.cisp_formatado} - ${props.nome}` : props.nome;
          const sub = props.municipio ? `${props.municipio} • ${props.batalhao || ''}` : `${tipo || ''}`;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title,
            sub,
            type: tipo || 'TERRITORIO',
            source: din ? `${din.faccao} · Fonte: ${din.fonte}` : undefined,
            sourceDetail: din ? `Ref: ${din.data} · ${din.confiabilidade}` : undefined
          });
          return true;
        }

        return false;
      });

      if (!hit) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
      const targetEl = map.getTargetElement();
      if (targetEl) targetEl.style.cursor = hit ? 'pointer' : '';
  });
}
