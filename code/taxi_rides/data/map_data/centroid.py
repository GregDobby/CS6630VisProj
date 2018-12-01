import json
import csv
from shapely.geometry import shape, Point
import os

# depending on your version, use: from shapely.geometry import shape, Point

# load GeoJSON file containing zones
with open('./taxi_zone_geojson.json') as f:
    js = json.load(f)

centroid={}

# load zones
for feature in js['features']:
    polygon = shape(feature['geometry'])
    locationid = feature['properties']['locationid']
    tmp = polygon.centroid

    centroid[locationid] = {"x":tmp.x, "y": tmp.y}

with open('./zone_centroid.json', 'w') as f:
    json.dump(centroid,f)