import pandas as pd
import numpy as np
import json as js
import os
import cfg

num_loc = cfg.meta_data['num_loc']
n = cfg.meta_data['slot']
num_slot = 24 * 60 // n
prob_precision = 6
precision = 3

# average statistics
class Stat():
    
    def __init__(self, slot):
        self.slot = slot
        self.num_total_trip = 0
        # transition probability
        self.probij = [{} for x in range(num_loc)]
        # trip distance
        self.trip_dist = [{} for x in range(num_loc)]
        # trip time
        self.trip_time = [{} for x in range(num_loc)]
        self.trip_time_m = [{} for x in range(num_loc)]
        # number of trips
        self.num_trip = [{} for x in range(num_loc)]
        # trip cost
#       'fare_amount', 'mta_tax', 'tolls_amount', 'tip_amount', 'total_amount', 'extra'
        self.trip_cost = [{} for x in range(num_loc)]
        self.fare_amount = [{} for x in range(num_loc)]
        self.mta_tax = [{} for x in range(num_loc)]
        self.tolls_amount = [{} for x in range(num_loc)]
        self.tip_amount = [{} for x in range(num_loc)]
        self.extra = [{} for x in range(num_loc)]
    
    def add(self, row):
        pickup_id = int(row['pickup_location_id']) - 1
        dropoff_id = int(row['dropoff_location_id']) - 1
        trip_time = int(row['dropoff_t']) - int(row['pickup_t'])
        trip_time_m = float(row['trip_time'])
        trip_dist = row['trip_distance']
        trip_cost = row['total_amount']
        fare_amount = row['fare_amount']
        mta_tax = row['mta_tax']
        tolls_amount = row['tolls_amount']
        tip_amount = row['tip_amount']
        extra = row['extra']
        
        self.num_total_trip += 1
        # init
        if not (dropoff_id in self.num_trip[pickup_id]):
            self.num_trip[pickup_id][dropoff_id] = 0
            self.trip_dist[pickup_id][dropoff_id] = 0
            self.trip_cost[pickup_id][dropoff_id] = 0
            self.trip_time[pickup_id][dropoff_id] = 0
            self.trip_time_m[pickup_id][dropoff_id] = 0
            self.fare_amount[pickup_id][dropoff_id] = 0
            self.mta_tax[pickup_id][dropoff_id] = 0
            self.tolls_amount[pickup_id][dropoff_id] = 0
            self.tip_amount[pickup_id][dropoff_id] = 0
            self.extra[pickup_id][dropoff_id] = 0
            
        self.num_trip[pickup_id][dropoff_id] += 1
        self.trip_dist[pickup_id][dropoff_id] += trip_dist
        self.trip_cost[pickup_id][dropoff_id] += trip_cost
        self.trip_time[pickup_id][dropoff_id] += trip_time
        self.trip_time_m[pickup_id][dropoff_id] += trip_time_m
        self.fare_amount[pickup_id][dropoff_id] += fare_amount
        self.mta_tax[pickup_id][dropoff_id] += mta_tax
        self.tolls_amount[pickup_id][dropoff_id] += tolls_amount
        self.tip_amount[pickup_id][dropoff_id] += tip_amount            
        self.extra[pickup_id][dropoff_id] += extra
    
    def calculate(self):
        for i in range(num_loc):
            num_trip_i = sum(self.num_trip[i].values())
            for j in self.num_trip[i]:
                if self.num_trip[i][j] != 0:
                    self.trip_dist[i][j] = round(self.trip_dist[i][j] / self.num_trip[i][j], precision)
                    self.trip_time[i][j] //= self.num_trip[i][j]
                    self.trip_time_m[i][j] /= self.num_trip[i][j]
                    self.trip_cost[i][j] = round(self.trip_cost[i][j] / self.num_trip[i][j], precision)
                    self.fare_amount[i][j] = round(self.fare_amount[i][j] / self.num_trip[i][j], precision)
                    self.mta_tax[i][j] = round(self.mta_tax[i][j]/ self.num_trip[i][j] , precision)
                    self.tolls_amount[i][j] = round(self.tolls_amount[i][j] / self.num_trip[i][j], precision)
                    self.tip_amount[i][j] = round(self.tip_amount[i][j] / self.num_trip[i][j], precision)
                    self.extra[i][j] = round(self.extra[i][j] / self.num_trip[i][j], precision)
                    self.probij[i][j] = round(self.num_trip[i][j] / num_trip_i, prob_precision)
        return self.__dict__


# year, month
years = range(2018, 2019)
months = range(1, 13)

summary0 = {}
for slot in range(num_slot):
    summary0[slot] = Stat(slot)

for year in years:
    year_dir = './' + str(year) + '-' + str(n) + 'minutes'
    if not os.path.exists(year_dir):
        print(year_dir + ' not found.')
        continue

    for month in months:
        if month < 10:
            mm = '0' + str(month)
        else:
            mm = str(month)
        
        # input file dir
        month_dir = year_dir + '/' + mm
        if not os.path.exists(month_dir):
            print(month_dir + ' not found.')
            continue

        summary = summary0.copy()
        # process data by day
        start_date = str(month) + '/1/' + str(year)
        if month == 12:
            end_date = '1/1/' + str(year + 1)
        else:
            end_date = str(month + 1) + '/1/' + str(year)

        dates = pd.date_range(start_date, end_date, freq='D')
        dates = dates[0:-1]
        
        # data for each date
        for date in dates:
            ifilename = month_dir + '/' + date.strftime('%d-%m-%Y') + '.csv'
            print('reading' + ifilename)
            if not os.path.exists(ifilename):
                continue
            df = pd.read_csv(ifilename)
            for index, row in df.iterrows():
                summary[int(row['pickup_t'])].add(row)
        out_dir = year_dir + "/" + mm + '-stat'
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)
        for slot in range(num_slot):
            ofilename = out_dir + '/slot-' + str(slot) + '.json'
            with open(ofilename, 'w') as outfile:
                js.dump(summary[slot].calculate(), outfile)
                print(ofilename + ' completed.')
       

