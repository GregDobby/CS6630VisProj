import json
import csv
from shapely.geometry import shape, Point
import pandas as pd
import numpy as np
import os

# depending on your version, use: from shapely.geometry import shape, Point

# load GeoJSON file containing zones
with open('./download_raw/taxi_zone_geojson.json') as f:
    js = json.load(f)

zones={}

# load zones
for feature in js['features']:
    polygon = shape(feature['geometry'])
    locationid = feature['properties']['locationid']
    zones[locationid] = polygon

def get_loc_id(longitude, latitude):
    point = Point(longitude, latitude)
    for id, polygon in zones.items():
        if polygon.contains(point):
            return id
    return '-1'

fields = ['pickup_datetime', 'pickup_location_id', 'dropoff_datetime', 'dropoff_location_id', 'trip_distance', 'fare_amount', 'mta_tax', 'tolls_amount', 'tip_amount', 'total_amount', 'extra']
# yellow_tripdata_yyyy-mm.csv
# 2010~2014
for year in range(2015, 2019):
    dir = './' + str(year) + '_yellow_tripdata'
    if not os.path.exists(dir):
        os.makedirs(dir)
    for month in range(1,13):
        if month < 10:
            mm = '0' + str(month)
        else:
            mm = str(month)
        ofilename = dir +'/yellow_tripdata_' + str(year) + '-' + mm + '.csv'
        ifilename = './download_raw/yellow_tripdata_' + str(year) + '-' + mm + '.csv'
        print('Process: '+ifilename)

        with open(ofilename, 'w+') as outputCSV:
            csvwriter = csv.writer(outputCSV)
            csvwriter.writerow(fields)
            
        for indf in pd.read_csv(ifilename, chunksize=1000):
            # clear empyt rows
            indf.dropna()
            # delete extra blank space         
            indf.columns = list(map(lambda x: x.strip(), indf.columns))
            
            if not 'PULocationID' in indf.columns:
                indf['pickup_location_id'] = indf.apply(lambda row: get_loc_id(row['pickup_longitude'], row['pickup_latitude']), axis = 1)
                indf['dropoff_location_id'] = indf.apply(lambda row: get_loc_id(row['dropoff_longitude'], row['dropoff_latitude']), axis = 1)
            else:
                indf['pickup_location_id'] = indf['PULocationID']
                indf['dropoff_location_id'] = indf['DOLocationID']
                
            if 'tpep_pickup_datetime' in indf.columns:
                indf['pickup_datetime'] = indf['tpep_pickup_datetime']
                indf['dropoff_datetime'] = indf['tpep_dropoff_datetime']
#             print(indf.columns)
            
            outdf = indf[fields[0:-1]]
            
            outdf['extra'] = indf.apply(lambda row: row['total_amount'] - (row['fare_amount'] + row['mta_tax'] + row['tolls_amount'] + row['tip_amount']), axis = 1)
                
            outdf.to_csv(ofilename, mode='a', header=False, index=False)


# 2015~2018
