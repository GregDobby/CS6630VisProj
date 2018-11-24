import json
import csv
from shapely.geometry import shape, Point
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

fields = ['pickup_datetime', 'pickup_location_id', 'dropoff_datetime', 'dropoff_location_id', 'trip_distance', 'fare_amount', 'mta_tax', 'tolls_amount', 'tip_amount', 'extra', 'total_amount']
out_rows = []
# yellow_tripdata_yyyy-mm.csv
# 2010~2014
for year in range(2011, 2012):
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

        with open(ofilename, 'w+') as outputCSV, open(ifilename, 'r') as inputCSV:
            csvwriter = csv.writer(outputCSV)
            csvreader = csv.reader(inputCSV)
            # write out headers
            csvwriter.writerow(fields)
            # read input headers
            raw_headers = next(csvreader)
            tmp = []
            for field in raw_headers:
                tmp.append(field.strip())
            raw_headers = tmp
            #            print(raw_headers)
            # corresponding columns in input file
            com_fields = ['trip_distance', 'fare_amount', 'mta_tax', 'tolls_amount',  'tip_amount', 'total_amount']
            for in_row in csvreader:
                try:
                    if not ''.join(in_row).strip():
                        continue
                    #                print(in_row)
                    select = []
                    
                    # datetime
                    pickuptime = ''
                    dropofftime =''
                    if 'pickup_datetime' in raw_headers:
                        idx = raw_headers.index('pickup_datetime')
                        pickuptime = in_row[idx];
                        idx = raw_headers.index('dropoff_datetime')
                        dropofftime = in_row[idx]
                    else:
                        idx = raw_headers.index('tpep_pickup_datetime')
                        pickuptime = in_row[idx];
                        idx = raw_headers.index('tpep_dropoff_datetime')
                        dropofftime = in_row[idx]
                    # common columns
                    for field in com_fields:
                        idx = raw_headers.index(field)
                        select.append(in_row[idx])
                    
                    # pickup locationid and dropoff locationid
                    pid = '-1';
                    did = '-1';
                    if 'PULocationID' in raw_headers:
                        idx = raw_headers.index('PULocationID')
                        pid = in_row[idx]
                        idx = raw_headers.index('DOLocationID')
                        did = in_row[idx]
                    else:
                        idx = raw_headers.index('pickup_longitude')
                        g1 = float(in_row[idx])
                        idx = raw_headers.index('pickup_latitude')
                        l1 = float(in_row[idx])
                        idx = raw_headers.index('dropoff_longitude')
                        g2 = float(in_row[idx])
                        idx = raw_headers.index('dropoff_latitude')
                        l2 = float(in_row[idx])
                        
                        
                        pP = Point(g1,l1)
                        dP = Point(g2,l2)
                        
                        for id, polygon in zones.items():
                            if pid == '-1':
                                if polygon.contains(pP):
                                    pid = id
                            if did == '-1':
                                if polygon.contains(dP):
                                    did = id
                            if pid != '-1' and did !='-1':
                                break
                    # filtered row
                    out_row = [None] * 11
                    # pickup_datetime
                    out_row[0] = pickuptime
                    # pickup_locationid
                    out_row[1] = pid
                    # dropoff_datetime
                    out_row[2] = dropofftime
                    # dropoff_locationid
                    out_row[3] = did
                    # trip_distance
                    out_row[4] = select[0]
                    # calculate extra
                    extra = 0;
                    # fare_amount
                    out_row[5] = float(select[1])
                    extra += out_row[5]
                    # mta_tax
                    out_row[6] = float(select[2])
                    extra += out_row[6]
                    # tolls_amount
                    out_row[7] = float(select[3])
                    extra += out_row[7]
                    # tip_amount
                    out_row[8] = float(select[4])
                    extra += out_row[8]
                    # total_amount
                    out_row[10] = float(select[5])
                    extra = out_row[10] - extra
                    #                print(out_row)
                    # extra
                    out_row[9] = extra
                    
                    out_rows.append(out_row)
                    
                    if len(out_rows) == 100000:
                        print('haha')
                        csvwriter.writerows(out_rows)
                        out_rows = []
                except:
                    continue


# 2015~2018
