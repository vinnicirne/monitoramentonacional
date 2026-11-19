import { Fill, Stroke, Style } from 'ol/style';
import { FAC_CATALOG, type CodigoFaccaoPrecisa } from '../../data/faccoesPrecisas';

const baseStyleCache: Record<string, Style> = {};
const highlightStyleCache: Record<string, Style> = {};

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const red = parseInt(cleanHex.substring(0, 2), 16);
  const green = parseInt(cleanHex.substring(2, 4), 16);
  const blue = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getFactionStyle(code: CodigoFaccaoPrecisa, highlight: boolean): Style {
  const cache = highlight ? highlightStyleCache : baseStyleCache;
  if (cache[code]) return cache[code];

  const metadata = FAC_CATALOG[code] || FAC_CATALOG.NEU;
  const fillAlpha = highlight ? 0.62 : code === 'NEU' ? 0.28 : 0.44;
  const style = new Style({
    stroke: new Stroke({ color: highlight ? '#ffffff' : metadata.color, width: highlight ? 2.8 : 1.7 }),
    fill: new Fill({ color: hexToRgba(metadata.color, fillAlpha) })
  });
  cache[code] = style;
  return style;
}
