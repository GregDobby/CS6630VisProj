var g_COM = {
    "map": null,
    "filter": null,
    "zones_stat": null,
    "zone_stat": null,
    "cfg": {
        "num_slot": 144,
        "num_loc": 265
    }
};

function array2d(r, c, v) {
    let result = [];
    for (let i = 0; i < r; i++) {
        let row = [];
        for (let j = 0; j < c; j++) {
            row.push(v);
        }
        result.push(row);
    }
    return result;
};

// process data
class DataItem {
    constructor(slot, num_loc) {
        this.slot = slot;
        this.num_loc = num_loc;
        this.num_trip = array2d(num_loc, num_loc, 0);
        this.trip_time = array2d(num_loc, num_loc, 0);
        this.trip_dist = array2d(num_loc, num_loc, 0);
        // fare_amount	mta_tax	tolls_amount	tip_amount	total_amount	extra
        this.fare_amount = array2d(num_loc, num_loc, 0);
        this.mta_tax = array2d(num_loc, num_loc, 0);
        this.tip_amount = array2d(num_loc, num_loc, 0);
        this.tolls_amount = array2d(num_loc, num_loc, 0);
        this.extra = array2d(num_loc, num_loc, 0);
        this.total_amount = array2d(num_loc, num_loc, 0);

        // supply & demand
        this.supply = null;
        this.demand = null;

    };



    add(row) {
        let pid = parseInt(row["pickup_location_id"]) - 1;
        let did = parseInt(row["dropoff_location_id"]) - 1;
        let time = parseInt(row["dropoff_t"]) - parseInt(row["pickup_t"]);
        let dist = parseFloat(row["trip_distance"]) || 0;

        this.num_trip[pid][did]++;
        this.trip_time[pid][did] += time;
        this.trip_dist[pid][did] += dist;
        this.fare_amount[pid][did] += parseFloat(row["fare_amount"]) || 0;
        this.mta_tax[pid][did] += parseFloat(row["mta_tax"]) || 0;
        this.tip_amount[pid][did] += parseFloat(row["tip_amount"]) || 0;
        this.tolls_amount[pid][did] += parseFloat(row["tolls_amount"]) || 0;
        this.extra[pid][did] += parseFloat(row["extra"]) || 0;
        this.total_amount[pid][did] += parseFloat(row["total_amount"]) || 0;
    };

    average() {
        for (let i = 0; i < this.num_loc; i++) {
            for (let j = 0; j < this.num_loc; j++) {
                if (this.num_trip[i][j] > 0) {
                    this.trip_time[i][j] /= this.num_trip[i][j];
                    this.trip_dist[i][j] /= this.num_trip[i][j];
                    this.fare_amount[i][j] /= this.num_trip[i][j];
                    this.mta_tax[i][j] /= this.num_trip[i][j];
                    this.tip_amount[i][j] /= this.num_trip[i][j];
                    this.tolls_amount[i][j] /= this.num_trip[i][j];
                    this.extra[i][j] /= this.num_trip[i][j];
                    this.total_amount[i][j] /= this.num_trip[i][j];
                }
            }
        }
    };
}
class DataManager {
    constructor() {
        this.trip_data = {
            "yellow": {
                "daily_data": null,
                "monthly_data": null
            },
            "green": {
                "daily_data": null,
                "monthly_data": null
            }
        };
        // filter config
        this.filter = null;
    };

    async load_data(filter) {

        let date = filter["date"];
        let start_slot = filter["start_slot"];
        let end_slot = filter["end_slot"];
        let type = filter["type"];
        let y_item_list = [];
        let y_mon_item_list = [];
        let g_item_list = [];
        let g_mon_item_list = [];
        let y_avg_supply_demand = null;
        let get_avg_supply_demand = null;

        // update filter config
        this.filter = filter;

        // yellow cab
        // if (type["yellow"] == 1)
        {
            // init data structure
            for (let slot = start_slot; slot <= end_slot; slot++) {
                y_item_list.push(new DataItem(slot, g_COM["cfg"]["num_loc"]));
            }
            // basic info
            let ifilename = "../data/yellow/2018-10minutes/" + date.slice(3, 5) + "/" + date + ".csv";
            let data = await d3.csv(ifilename);
            data.forEach(d => {
                let slot = parseInt(d["pickup_t"]);
                if (slot >= start_slot && slot <= end_slot) {
                    y_item_list[slot].add(d);
                }
            });
            y_item_list.forEach(d => {
                d.average();
            });
            // supply & demand
            ifilename = "../data/yellow/2018-10minutes/" + date.slice(3, 5) + "-supply_demand/" + date + ".json";
            data = await d3.json(ifilename);
            for (let slot = start_slot; slot <= end_slot; slot++) {
                y_item_list[slot].supply = data["supply"][slot];
                y_item_list[slot].demand = data["demand"][slot];
            }
            // monthly & stat
            for (let slot = start_slot; slot <= end_slot; slot++) {
                ifilename = "../data/yellow/2018-10minutes/" + date.slice(3, 5) + "-stat/slot-" + slot + ".json";
                data = await d3.json(ifilename);
                y_mon_item_list.push(this.convert_monthly_data(data));
            }
        }

        // green cab
        // if (type["green"] == 1) 
        {
            // init data structure
            for (let slot = start_slot; slot <= end_slot; slot++) {
                g_item_list.push(new DataItem(slot, g_COM["cfg"]["num_loc"]));
            }
            // basic info
            let ifilename = "../data/green/2018-10minutes/" + date.slice(3, 5) + "/" + date + ".csv";
            let data = await d3.csv(ifilename);
            data.forEach(d => {
                let slot = parseInt(d["pickup_t"]);
                if (slot >= start_slot && slot <= end_slot) {
                    g_item_list[slot].add(d);
                }
            });
            g_item_list.forEach(d => {
                d.average();
            });
            // supply & demand
            ifilename = "../data/green/2018-10minutes/" + date.slice(3, 5) + "-supply_demand/" + date + ".json";
            data = await d3.json(ifilename);
            for (let slot = start_slot; slot <= end_slot; slot++) {
                g_item_list[slot].supply = data["supply"][slot];
                g_item_list[slot].demand = data["demand"][slot];
            }
            // monthly stat
            for (let slot = start_slot; slot <= end_slot; slot++) {
                ifilename = "../data/green/2018-10minutes/" + date.slice(3, 5) + "-stat/slot-" + slot + ".json";
                data = await d3.json(ifilename);
                g_mon_item_list.push(this.convert_monthly_data(data));
            }
        }

        this.trip_data = {
            "yellow": {
                "daily_data": y_item_list,
                "monthly_data": y_mon_item_list
            },
            "green": {
                "daily_data": g_item_list,
                "monthly_data": g_mon_item_list
            }
        };
    };

    convert_monthly_data(data) {
        let slot = parseInt(data["slot"]);
        let num_loc = g_COM["cfg"]["num_loc"];
        let data_item = new DataItem(slot, num_loc);
        let num_trip = data["num_trip"];
        let trip_time = data["trip_time"];
        let trip_dist = data["trip_dist"];
        let fare_amount = data['fare_amount'];
        let mta_tax = data['mta_tax'];
        let tolls_amount = data['tolls_amount'];
        let tip_amount = data['tip_amount'];
        let extra = data['extra'];
        let total_amount = data["trip_cost"];
        for (let i = 0; i < num_loc; i++) {
            for (let k in num_trip[i]) {
                let j = parseInt(k);
                data_item.num_trip[i][j] = num_trip[i][k];
                data_item.trip_time[i][j] = trip_time[i][k];
                data_item.trip_dist[i][j] = trip_dist[i][j];
                data_item.fare_amount[i][j] = fare_amount[i][k];
                data_item.mta_tax[i][j] = mta_tax[i][k];
                data_item.tolls_amount[i][j] = tolls_amount[i][k];
                data_item.tip_amount[i][j] = tip_amount[i][k];
                data_item.extra[i][j] = extra[i][k];
                data_item.total_amount[i][j] = total_amount[i][k];
            }
        }
        return data_item;
    };

    get_trip_data() {
        return this.trip_data;
    }

    get_avg_supply_demand() {

        let supply_demand = {};
        let start_slot = this.filter["start_slot"];
        let end_slot = this.filter["end_slot"];
        let num_loc = g_COM["cfg"]["num_loc"];
        let num_slot = end_slot - start_slot + 1;
        let yellow = {};
        let green = {};
        // if (this.filter["type"]["yellow"] == 1) 
        {
            let avg_supply = Array(num_loc).fill(0);
            let avg_demand = Array(num_loc).fill(0);
            for (let slot = start_slot, i = 0; slot <= end_slot; slot++, i++) {

                let supply = this.trip_data["yellow"]["daily_data"][i].supply;
                let demand = this.trip_data["yellow"]["daily_data"][i].demand;
                // yellow 
                for (let j = 0; j < num_loc; j++) {
                    avg_supply[j] += supply[j];
                    avg_demand[j] += demand[j];
                }
            }



            for (let j = 0; j < num_loc; j++) {
                avg_supply[j] /= num_slot;
                avg_demand[j] /= num_slot;
            }
            yellow["supply"] = avg_supply;
            yellow["demand"] = avg_demand;
        }

        // if (this.filter["type"]["green"] == 1) 
        {
            let avg_supply = Array(num_loc).fill(0);
            let avg_demand = Array(num_loc).fill(0);
            for (let slot = start_slot, i = 0; slot <= end_slot; slot++, i++) {
                let supply = this.trip_data["green"]["daily_data"][i].supply;
                let demand = this.trip_data["green"]["daily_data"][i].demand;
                // green 
                for (let j = 0; j < num_loc; j++) {
                    avg_supply[j] += supply[j];
                    avg_demand[j] += demand[j];
                }
            }
            for (let j = 0; j < num_loc; j++) {
                avg_supply[j] /= num_slot;
                avg_demand[j] /= num_slot;
            }
            green["supply"] = avg_supply;
            green["demand"] = avg_demand;
        }

        supply_demand["yellow"] = yellow;
        supply_demand["green"] = green;

        return supply_demand;

    }

    get_trip_data_by_loc_id(lid) {
        let trip_data = [];
        let start_slot = this.filter["start_slot"];
        let end_slot = this.filter["end_slot"];
        for (let slot = start_slot, i = 0; slot <= end_slot; slot++, i++) {
            let yellow = {};
            let green = {};
            // yellow 
            // if (this.filter["type"]["yellow"] == 1) 
            {
                let daily_data = this.trip_data["yellow"]["daily_data"][i];
                let monthly_data = this.trip_data["yellow"]["monthly_data"][i];

                // daily
                yellow["daily_data"] = {
                    "num_trip": daily_data.num_trip[lid],
                    "trip_time": daily_data.trip_time[lid],
                    "trip_dist": daily_data.trip_dist[lid],
                    "fare_amount": daily_data.fare_amount[lid],
                    "mta_tax": daily_data.mta_tax[lid],
                    "tolls_amount": daily_data.tolls_amount[lid],
                    "tip_amount": daily_data.tip_amount[lid],
                    "extra": daily_data.extra[lid],
                    "total_amount": daily_data.total_amount[lid]
                };
                // monthly
                yellow["monthly_data"] = {
                    "num_trip": monthly_data.num_trip[lid],
                    "trip_time": monthly_data.trip_time[lid],
                    "trip_dist": monthly_data.trip_dist[lid],
                    "fare_amount": monthly_data.fare_amount[lid],
                    "mta_tax": monthly_data.mta_tax[lid],
                    "tolls_amount": monthly_data.tolls_amount[lid],
                    "tip_amount": monthly_data.tip_amount[lid],
                    "extra": monthly_data.extra[lid],
                    "total_amount": monthly_data.total_amount[lid]
                };
            }
            // green
            // if (this.filter["type"]["green"] == 1) 
            {
                let daily_data = this.trip_data["green"]["daily_data"][i];
                let monthly_data = this.trip_data["green"]["monthly_data"][i];

                // daily
                green["daily_data"] = {
                    "num_trip": daily_data.num_trip[lid],
                    "trip_time": daily_data.trip_time[lid],
                    "trip_dist": daily_data.trip_dist[lid],
                    "fare_amount": daily_data.fare_amount[lid],
                    "mta_tax": daily_data.mta_tax[lid],
                    "tolls_amount": daily_data.tolls_amount[lid],
                    "tip_amount": daily_data.tip_amount[lid],
                    "extra": daily_data.extra[lid],
                    "total_amount": daily_data.total_amount[lid]
                };
                // monthly
                green["monthly_data"] = {
                    "num_trip": monthly_data.num_trip[lid],
                    "trip_time": monthly_data.trip_time[lid],
                    "trip_dist": monthly_data.trip_dist[lid],
                    "fare_amount": monthly_data.fare_amount[lid],
                    "mta_tax": monthly_data.mta_tax[lid],
                    "tolls_amount": monthly_data.tolls_amount[lid],
                    "tip_amount": monthly_data.tip_amount[lid],
                    "extra": monthly_data.extra[lid],
                    "total_amount": monthly_data.total_amount[lid]
                };
            }

            let e = {
                "slot": slot,
                "loc_id": lid,
                "yellow": yellow,
                "green": green
            };

            trip_data.push(e);
        }

        return trip_data;
    };
};

var g_dataManager = new DataManager();