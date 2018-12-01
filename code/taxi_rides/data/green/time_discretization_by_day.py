import pandas as pd
import numpy as np
import os


# year, month 
years = range(2018,2019)
months = range(1,13) 

for year in years:
    dir = './' + str(year) + '_green_tripdata'
    if not os.path.exists(dir):
        print(dir + ' not found.')
        continue
    
    for month in months:
        if month < 10:
            mm = '0' + str(month)
        else:
            mm = str(month)
        # process data by day
        start_date = str(month) + '/1/'+ str(year)
        if month == 12:
            end_date = '1/1/' + str(year + 1)
        else:
            end_date = str(month + 1)+'/1/'+ str(year)
        
        dates = pd.date_range(start_date, end_date, freq='D')
        
        # input file name
        ifilename = dir +'/green_tripdata_' + str(year) + '-' + mm + '.csv'
        
        if not os.path.exists(ifilename):
            continue
        # read file
        headers = ['pickup_datetime', 'pickup_location_id', 'dropoff_datetime', 'dropoff_location_id', 'trip_distance', 'fare_amount', 'mta_tax', 'tolls_amount', 'tip_amount', 'total_amount', 'extra']
        
        df = pd.read_csv(ifilename, parse_dates = ['pickup_datetime', 'dropoff_datetime'])
        
        # drop duplicates
        df.drop_duplicates();
        
        # drop rows with invalid location id
        df = df[(df['pickup_location_id'] != -1) & (df['dropoff_location_id'] != -1)]
        
        df['pds'] = df['pickup_datetime'].dt.normalize();
        df['dds'] = df['dropoff_datetime'].dt.normalize();
        # pickup and dropoff in the same day
        df = df[df['pds'] == df['dds']]
        
        out_dir = str(year) + '/' + mm;
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)
        
        for date in dates[0:-1]:
            df1 = df[df['pds'] == date]
            df1 = df1[headers]
            ofilename = out_dir+'/' + date.strftime('%d-%m-%Y') + '.csv'
            print(ofilename + 'completed.')
            df1.to_csv(ofilename, mode='a', header=headers, index=False)
        
        
        
        
        
        
        
        
        
        
        
        
        
    
