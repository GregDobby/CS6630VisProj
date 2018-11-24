class DataItem {
    constructor(slot, num_loc) {
        this.slot = slot;
        this.num_loc = num_loc;
        this.num_trip = Array(num_loc).fill(Array(num_loc).fill(0));
        this.trip_time = Array(num_loc).fill(Array(num_loc).fill(0));
        this.trip_dist = Array(num_loc).fill(Array(num_loc).fill(0));
        // fare_amount	mta_tax	tolls_amount	tip_amount	total_amount	extra
        this.fare_amount = Array(num_loc).fill(Array(num_loc).fill(0));
        this.mta_tax = Array(num_loc).fill(Array(num_loc).fill(0));
        this.tip_amount = Array(num_loc).fill(Array(num_loc).fill(0));
        this.extra = Array(num_loc).fill(Array(num_loc).fill(0));
        this.total_amount = Array(num_loc).fill(Array(num_loc).fill(0));

        // supply & demand
        this.supply = null;
        this.demand = null;
    }

    add(row) {
        pid = parseInt(row["pickup_location_id"]) - 1;
        did = parseInt(row["dropoff_location_id"]) - 1;
        time = parseInt(row["dropoff_t"]) - parseInt(row["pickup_t"]);
        dist = parseFloat(row["trip_distance"]) || 0;

        this.num_trip[pid][did]++;
        this.trip_time[pid][did] += time;
        this.trip_dist[pid][did] += dist;
        this.fare_amount[pid][did] += parseFloat(row["fare_amount"]) || 0;
        this.mta_tax[pid][did] += parseFloat(row["mta_tax"]) || 0;
        this.tip_amount[pid][did] += parseFloat(row["tip_amount"]) || 0;
        this.extra[pid][did] += parseFloat(row["extra"]) || 0;
        this.total_amount[pid][did] += parseFloat(row["total_amount"]) || 0;
    }

    average() {
        for (let i = 0; i < this.num_loc; i++) {
            for (let j = 0; j < this.num_loc; j++) {
                this.trip_time[i][j] /= this.num_trip[i][j];
                this.trip_dist[i][j] /= this.num_trip[i][j];
                this.fare_amount[i][j] /= this.num_trip[i][j];
                this.mta_tax[i][j] /= this.num_trip[i][j];
                this.tip_amount[i][j] /= this.num_trip[i][j];
                this.extra[i][j] /= this.num_trip[i][j];
                this.total_amount[i][j] /= this.num_trip[i][j];
            }
        }
    }
}



class Map {
    constructor(g_COM) {

        // global components
        this.COM = g_COM;

        this.margin = {
            v: 20,
            h: 20
        };

        let mapView = d3.select("#map-view");
        let boudingRect = mapView.node().getBoundingClientRect();

        this.svgWidth = boudingRect.width - this.margin.h;
        this.svgHeight = boudingRect.height - this.margin.v;

        this.mapCanvas = mapView.append("svg")
            .style("width", this.svgWidth)
            .style("height", this.svgHeight)
            .append("g");
        this.pan_zoom_rect = this.mapCanvas.append("rect")
            .style("width", this.svgWidth)
            .style("height", this.svgHeight)
            .style("fill", "none")
            .style("pointer-events", "all");

        this.geojson = null;
        this.zone_lookup = null;
        this.projection = null;
    };
    // initlization
    async init() {
        let that = this;
        // load geojson
        this.geojson = await d3.json("../data/map_data/taxi_zone_geojson.json");

        // load lookup table
        // let lookup_csv= await d3.csv("../data/map_data/taxi _zone_lookup.csv");
        // this.zone_lookup = {};
        // lookup_csv.map(d=>{
        //     that.zone_lookup[d["LocationID"]] = {
        //         "borough" :  d["Borough"],
        //         "zone" : d["Zone"],
        //         "service_zone": d["service_zone"]
        //     };
        // });
        // projection
        this.projection = {
            center: [-74, 40.75],
            scale: 100000,
            projGenerator: d3.geoMercator(),
            get_projection: function () {
                return this.projGenerator
                    .center(this.center)
                    .scale(this.scale)
                    .translate([that.svgWidth / 2, that.svgHeight / 2]);
            }
        };
        // pan zoom
        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .on("zoom", function () {
                that.mapCanvas.attr("transform", d3.event.transform);
            });
        this.pan_zoom_rect.call(zoom);
    };
    // update data
    async update(filter) {
        if (filter != null && filter != undefined) {

        }
    }

    async load_data(date, start_slot, end_slot, type) {

        if (type["yellow"] == 1) {
            // init data structure
            let y_item_list = [];
            for (let slot = start_slot; slot <= end_slot; slot++) {
                y_item_list.append(new DataItem(slot, this.COM["cfg"]["num_loc"]));
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
            for(let slot = start_slot; slot<=end_slot; slot++){
                y_item_list[slot].supply = data["supply"][slot];
                y_item_list[slot].demand = data["demand"][slot];
            }
            // monthly & stat


        }

    }


    // render view
    show() {
        let zoneGrps = this.mapCanvas.selectAll("g").data(this.geojson.features);
        zoneGrps.exit().remove();
        zoneGrps = zoneGrps.enter().append("g").merge(zoneGrps);

        let pathGenerator = d3.geoPath().projection(this.projection.get_projection());

        zoneGrps.append("path")
            .attr("d", pathGenerator)
            .on("mouseover", function (d) {
                // show zone information
                d3.select("#zone-id").html(d["properties"]["locationid"]);
                d3.select("#zone-name").html(d["properties"]["zone"]);
                d3.select("#borough").html(d["properties"]["borough"]);
                d3.select("#zone-chart").style("opacity", 1);
            })
            .on("mouseout", function (d) {
                d3.select("#zone-chart").style("opacity", 0);
            });
    };


};