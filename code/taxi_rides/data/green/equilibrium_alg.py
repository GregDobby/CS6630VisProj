import numpy as np
import pandas as pd
import json as js
import copy
import os
import cfg


def load_match(date, n):
    ifilename = '{year}-{n}minutes/{month}-day_stat/{date}.json'.format(year=date.strftime('%Y'), n=n, month=date.strftime('%m'), date=date.strftime('%d-%m-%Y'))
    if not os.path.exists(ifilename):
        print(ifilename + ' not found.')
        return None
    else:
        print('Reading ' + ifilename)
        with open(ifilename, 'r') as in_file:
            tmp = js.load(in_file)
        return tmp


def load_monthly_stat(year, month, n):
    num_slot = 24 * 60 // n
    stat = [None for i in range(num_slot)]
    count = 0
    for slot in range(num_slot):
        ifilename = '{year}-{n}minutes/{month}-stat/slot-{slot}.json'.format(year=year, month=month, slot=slot, n=n)
        if not os.path.exists(ifilename):
            print(ifilename + ' not found.')
            continue
        print('Reading ' + ifilename)
        with open(ifilename, 'r') as in_file:
            stat[slot] = js.load(in_file)
        count += 1
    
    if count == 0:
        return None
    else:
        return stat
        

def init_S(day_stat):
    num_green = 3579
    total_match = day_stat['total_match']
    S = copy.deepcopy(day_stat['match'])
    num_slot = len(total_match)
    num_loc = len(S[0])
    for slot in range(num_slot):
        remain = num_green - total_match[slot]
        r = np.random.rand(num_loc)
        r /= r.sum()
        for i in range(num_loc):
            S[slot][i] += round(remain * r[i])
    return S


def cal_V(S, day_stat, month_stat):
    match = day_stat['match']
    num_slot = len(match)
    num_loc = len(match[0])
    V = [[0 for i in range(num_loc)] for j in range(num_slot)]
    
    gamma = 3
    epsilon = 5
    for slot in reversed(range(num_slot)):
        prob = month_stat[slot]['probij']
        dist = month_stat[slot]['trip_dist']
        cost = month_stat[slot]['trip_cost']
        time = month_stat[slot]['trip_time']
        for i in range(num_loc):
            # exp  value of fare
            exp_fare = 0
            # exp  value of vacancy
            exp_v = 0
            for j in range(num_loc):
                strj = str(j)
                if strj in prob[i]:
                    cij = dist[i][strj] * 0.1
                    tij = slot + time[i][strj]
                    exp_fare += prob[i][strj] * (cost[i][strj] - cij + V[tij][j])
                    if i == j:
                        tij = min(gamma+tij, num_slot - 1)
                    exp_v = max(exp_v, V[tij][j] - cij + epsilon)
            if S[slot][i] > 0:
                p = match[slot][i] / S[slot][i]
                V[slot][i] = p * exp_fare + (1 - p) * exp_v  
            else:
                V[slot][i] = 0  
            if V[slot][i] < 0:
                print('p: '+ str(p) + ' exp_fare: ' + str(exp_fare) + ' exp_v: ' + str(exp_v))
                print('V ' + str(V[slot][i]))            
    return V


def transit(S, V, day_stat, month_stat):
    num_slot = len(S)
    num_loc = len(S[0])
    drop = day_stat['drop']
    match = day_stat['match']
    scale = 1000
#     S = S_old.copy()
    for slot in range(num_slot):
        dist = month_stat[slot]['trip_dist']
        time = month_stat[slot]['trip_time']
        
        for i in range(num_loc):
            # policy
            p = {}
            z = 0
            for j in range(num_loc):
                strj = str(j)
                if strj in dist[i]:
                    tij = time[i][strj] + slot
                    cij = dist[i][strj] * 0.1
                    
                    p[strj] = np.exp((V[tij][j] - cij) / scale)
                    if p[strj] == np.inf:
                        print('v-c ' + str(V[tij][j] - cij))
                    z += p[strj]
            # transit
            v = S[slot][i] + drop[slot][i] - match[slot][i]
            S[slot][i] = match[slot][i]
#             print(p)
            for j in p:
                p[j] /= z
                tij = time[i][j] + slot
                S[tij][int(j)] += round(v * p[j])
    return S


def equilibrium(month_stat, day_stat):
    threshold = 1
    # init S
    S = init_S(day_stat)
    num_slot = len(S)
    num_loc = len(S[0])
    # init V
    V = [[0 for i in range(num_loc)] for j in range(num_slot)]
    diff = 10
    iter = 1
    while diff > threshold:
#     for i in range(1):
        V_new = cal_V(S, day_stat, month_stat)
        S = transit(S, V_new, day_stat, month_stat)
        diff = 0
        for i in range(num_slot):
            for j in range(num_loc):
#                 print(str(V[i][j] - V_new[i][j]))
                diff += abs(V[i][j] - V_new[i][j])
        diff /= num_slot * num_loc
        print('iter: ' + str(iter) +' diff: '+ str(diff))
        iter += 1
        V = V_new
        
    # estimate lambda and alpha
    D = [[0 for i in range(num_loc)] for j in range(num_slot)]
    match = day_stat['match']
    for slot in range(num_slot):
        for i in range(num_loc):
            v = S[slot][i]
            m = match[slot][i]
            
            if v > 0:
                if m == v:
                    D[slot][i] = round(v * (1 + np.random.rand()))
                else:
                    D[slot][i] = round(- v * np.log(1 - m / v))
    return S, D


# load config
num_loc = cfg.meta_data['num_loc']
n = cfg.meta_data['slot']
num_slot = 24 * 60 // n

# year, month 
years = range(2018, 2019)
months = range(1, 13) 

for year in years:
    for month in months:
        
        if month < 10:
            mm = '0' + str(month)
        else:
            mm = str(month)
            
        # load monthly stat
        month_stat = load_monthly_stat(year, mm, n)
        if month_stat == None:
            continue
        
        start_date = str(month) + '/1/' + str(year)
        if month == 12:
            end_date = '1/1/' + str(year + 1)
        else:
            end_date = str(month + 1) + '/1/' + str(year)
        dates = pd.date_range(start_date, end_date, freq='D')
        dates = dates[0:-1]
        
        dir = '{year}-{n}minutes/{month}-supply_demand'.format(year=year, n=n, month=mm)
        if not os.path.exists(dir):
            os.makedirs(dir)
            
        for date in dates:
            # load day match
            day_stat = load_match(date, n)
            if day_stat == None:
                continue
            # calculate equilibrium
            S, D = equilibrium(month_stat, day_stat)
            sd = {'supply' : S, 'demand' : D}
            ofilename = '{year}-{n}minutes/{month}-supply_demand/{date}.json'.format(year=date.strftime('%Y'), n=n, month=date.strftime('%m'), date=date.strftime('%d-%m-%Y'))
            with open(ofilename, 'w') as out_file:
                js.dump(sd, out_file)
            
            
            
            
            
            
