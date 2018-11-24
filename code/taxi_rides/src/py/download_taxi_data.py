import urllib.request

for y in range(0,9):
    for m in range(1,13):
        if m < 10:
            h = '0'+str(m)
        else:
            h = ''+ str(m)
        filedata = urllib.request.urlopen('https://s3.amazonaws.com/nyc-tlc/trip+data/yellow_tripdata_201'+str(y)+'-'+h+'.csv')
        print('fetch: https://s3.amazonaws.com/nyc-tlc/trip+data/yellow_tripdata_201'+str(y)+'-'+h+'.csv')  
        datatowrite = filedata.read()
        with open('./yellow_tripdata_201'+str(y)+'-'+h+'.csv', 'wb') as f:  
            f.write(datatowrite)