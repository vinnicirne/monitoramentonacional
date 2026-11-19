import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import type { AddressSearchResult } from '../../../utils/geocoding';

export function createAddressMarkerFeatures(address: AddressSearchResult): Feature[] {
  const coordinate = fromLonLat([address.lng, address.lat]);
  const pin = new Feature({ geometry: new Point(coordinate), type: 'SEARCHED_ADDRESS' });
  pin.setStyle(new Style({
    image: new CircleStyle({ radius: 10, fill: new Fill({ color: '#3483FA' }), stroke: new Stroke({ color: '#FFE600', width: 3 }) }),
    text: new Text({
      text: address.shortTitle,
      font: "bold 11px 'Plus Jakarta Sans', sans-serif",
      fill: new Fill({ color: '#ffffff' }),
      stroke: new Stroke({ color: '#2D3277', width: 3.5 }),
      offsetY: -18
    })
  }));

  const halo = new Feature({ geometry: new Point(coordinate) });
  halo.setStyle(new Style({
    image: new CircleStyle({ radius: 19, fill: new Fill({ color: 'rgba(52, 131, 250, 0.22)' }), stroke: new Stroke({ color: '#3483FA', width: 1.5 }) })
  }));

  return [halo, pin];
}
