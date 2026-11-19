import Feature from 'ol/Feature';
import CircleGeom from 'ol/geom/Circle';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';

export function createLiveGpsFeatures(longitude: number, latitude: number, accuracy: number) {
  const coordinate = fromLonLat([longitude, latitude]);
  const radiusMetersMercator = Math.max(accuracy, 12) / Math.cos((latitude * Math.PI) / 180);
  const accuracyFeature = new Feature({ geometry: new CircleGeom(coordinate, radiusMetersMercator) });
  accuracyFeature.setStyle(new Style({
    fill: new Fill({ color: 'rgba(0, 166, 80, 0.14)' }),
    stroke: new Stroke({ color: 'rgba(0, 166, 80, 0.7)', width: 1.5 })
  }));

  const locationFeature = new Feature({ geometry: new Point(coordinate) });
  locationFeature.setStyle(new Style({
    image: new CircleStyle({ radius: 9, fill: new Fill({ color: '#00A650' }), stroke: new Stroke({ color: '#ffffff', width: 3 }) }),
    text: new Text({
      text: 'VOCÊ (AO VIVO)',
      font: "bold 10px 'JetBrains Mono', monospace",
      fill: new Fill({ color: '#ffffff' }),
      stroke: new Stroke({ color: '#006832', width: 3 }),
      offsetY: -16
    })
  }));

  return { coordinate, features: [accuracyFeature, locationFeature] };
}

export function getGeolocationErrorMessage(code: number) {
  if (code === 1) return 'Permissão de localização negada no navegador. Libere o acesso ao GPS para rastrear ao vivo.';
  if (code === 2) return 'Sinal de localização indisponível no momento.';
  return 'Tempo esgotado ao obter localização GPS.';
}
