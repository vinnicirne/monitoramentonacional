import os
import re
import json
import xml.etree.ElementTree as ET
from shapely.geometry import Polygon, MultiPolygon, Point, mapping
from shapely.ops import unary_union
from shapely.validation import make_valid

def parse_coords(coord_str):
    pts = []
    for item in coord_str.strip().split():
        if not item:
            continue
        parts = item.split(',')
        if len(parts) >= 2:
            try:
                lon = float(parts[0])
                lat = float(parts[1])
                pts.append((lon, lat))
            except ValueError:
                continue
    return pts

def parse_kml_geometry(elem, ns):
    polys = []
    for p in elem.findall('.//k:Polygon', ns):
        outer_el = p.find('.//k:outerBoundaryIs//k:coordinates', ns)
        if outer_el is None or not outer_el.text:
            continue
        outer_pts = parse_coords(outer_el.text)
        if len(outer_pts) < 3:
            continue
        
        inners = []
        for inner_el in p.findall('.//k:innerBoundaryIs//k:coordinates', ns):
            if inner_el.text:
                ipts = parse_coords(inner_el.text)
                if len(ipts) >= 3:
                    inners.append(ipts)
        
        try:
            poly = Polygon(outer_pts, inners)
            if not poly.is_valid:
                poly = make_valid(poly)
            if poly.geom_type == 'Polygon' and not poly.is_empty:
                polys.append(poly)
            elif poly.geom_type == 'MultiPolygon':
                for sub in poly.geoms:
                    if not sub.is_empty:
                        polys.append(sub)
            elif poly.geom_type == 'GeometryCollection':
                for g in poly.geoms:
                    if g.geom_type in ['Polygon', 'MultiPolygon'] and not g.is_empty:
                        if g.geom_type == 'Polygon':
                            polys.append(g)
                        else:
                            polys.extend([sub for sub in g.geoms if not sub.is_empty])
        except Exception as e:
            continue

    if not polys:
        return None
    if len(polys) == 1:
        return polys[0]
    return MultiPolygon(polys)

print("Helper functions ready")

