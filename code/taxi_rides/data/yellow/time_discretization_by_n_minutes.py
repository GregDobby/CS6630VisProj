import pandas as pd
import numpy as np
import os
import cfg

# year, month 
years = range(2018,2019)
months = range(1,13) 

# minutes
n = cfg.meta_data['slot']

for year in years:
    year_dir = './' + str(year)
    if not os.path.exists(year_dir):
        print(year_dir + ' not found.')
        continue
    
    for month in months:
        if month < 10:
            mm = '0' + str(month)
        else:
            mm = str(month)
        
        # input file dir
        month_dir = year_dir +'/' + mm
        if not os.path.exists(month_dir):
            print(month_dir + ' not found.')
            continue
        
         # process data by day
        start_date = str(month) + '/1/'+ str(year)
        if month == 12:
            end_date = '1/1/' + str(year + 1)
        else:
            end_date = str(month + 1)+'/1/'+ str(year)
        
        dates = pd.date_range(start_date, end_date, freq='D')
        dates = dates[0:-1]
        
        
        # data for each date
        for date in dates:
            start = date.value
            ifilename = month_dir +'/' + date.strftime('%d-%m-%Y') + '.csv'
            df = pd.read_csv(ifilename, parse_dates = ['pickup_datetime', 'dropoff_datetime'])
            
            df['pickup_t'] = (df['pickup_datetime'].astype(np.int64) - start) / 1e9 / 60 // n
            df['dropoff_t'] = (df['dropoff_datetime'].astype(np.int64) - start) / 1e9 / 60 // n
            
            df['trip_time'] = (df['dropoff_datetime'].astype(np.int64) - start) / 1e9 / 60 - (df['pickup_datetime'].astype(np.int64) - start) / 1e9 / 60;
            
            ofilename = './' + str(year)+ '-' + str(n) +'minutes/' + mm
            if not os.path.exists(ofilename):
                os.makedirs(ofilename)
            ofilename += '/' + date.strftime('%d-%m-%Y') + '.csv'
            headers = ['pickup_t', 'pickup_location_id', 'dropoff_t', 'dropoff_location_id', 'trip_distance', 'fare_amount', 'mta_tax', 'tolls_amount', 'tip_amount', 'total_amount', 'extra', 'trip_time']
            df = df[headers]
            df.to_csv(ofilename, header=headers, index=False)
            print(ofilename + ' completed.')
            
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    