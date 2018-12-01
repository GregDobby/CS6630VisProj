import pandas as pd
import numpy as np
import json as js
import os
import cfg

# load config
num_loc = cfg.meta_data['num_loc']
n = cfg.meta_data['slot']
num_slot = 24 * 60 // n
# year, month
years = range(2018, 2019)
months = range(1, 13)

class Match_Drop():
    def __init__(self):
        self.match = [[0 for i in range(num_loc)] for j in range(num_slot)]
        self.drop = [[0 for i in range(num_loc)] for j in range(num_slot)]
        self.total_match = [0 for i in range(num_slot)]
    
    def add(self, row):
        pid = int(row['pickup_location_id']) - 1
        did = int(row['dropoff_location_id']) - 1
        pt = int(row['pickup_t'])
        dt = int(row['dropoff_t'])
        self.match[pt][pid] += 1
        self.drop[dt][did] += 1
        self.total_match[pt] +=1


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
            stat = Match_Drop()
            ifilename = month_dir + '/' + date.strftime('%d-%m-%Y') + '.csv'
            print('reading' + ifilename)
            if not os.path.exists(ifilename):
                continue
            df = pd.read_csv(ifilename)
            for index, row in df.iterrows():
                stat.add(row)
            out_dir = year_dir + "/" + mm + '-day_stat'
            if not os.path.exists(out_dir):
                os.makedirs(out_dir)
            ofilename = out_dir + '/' + date.strftime('%d-%m-%Y') + '.json'
            with open(ofilename, 'w') as outfile:
                js.dump(stat.__dict__, outfile)
                print(ofilename + ' completed.')
                
                
                
                
                
                
                