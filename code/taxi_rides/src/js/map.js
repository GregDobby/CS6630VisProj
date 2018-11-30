class Map {
    constructor() {

        this.margin = {
            v: 20,
            h: 20
        };

        this.legendDim = {
            width: 250,
            height: 15
        };

        let mapView = d3.select("#map-view");
        let boudingRect = mapView.node().getBoundingClientRect();

        this.svgWidth = boudingRect.width - this.margin.h;
        this.svgHeight = boudingRect.height - this.margin.v;

        this.mapViewSvg = mapView.append("svg")
            .style("width", this.svgWidth)
            .style("height", this.svgHeight);



        this.legend = this.mapViewSvg.append("g")
            .attr("transform", "translate(" + (this.svgWidth - this.legendDim.width - 100) + "," + (this.svgHeight - this.legendDim.height - 50) + ")");

        this.mapCanvas = this.mapViewSvg.append("g");

        this.routeCanvas = this.mapViewSvg.append("g");

        // this.pan_zoom_rect = this.mapCanvas.append("rect")
        //     .style("width", this.svgWidth)
        //     .style("height", this.svgHeight)
        //     .style("fill", "none")
        //     .style("pointer-events", "all");
        // map json
        this.geojson = null;
        this.centroid = null;
        this.id2name = null;
        // map projection
        this.projection = null;
        // supply demand data
        this.filtered_data = null;


        // legend color scales
        this.demandColorScale = null;
        this.ySupplyColorScale = null;
        this.gSupplyColorScale = null;
        this.legendColorScale = null;
        // legend axis scale
        this.legendAxisScale = null;

        // select
        this.singleSelection = 0;
        this.multipleSelection = [];
        this.routeSelection = [0, 0];

    };
    // initlization
    async init() {
        let that = this;
        // load geojson
        this.geojson = await d3.json("../data/map_data/taxi_zone_geojson.json");
        this.centroid = await d3.json("../data/map_data/zone_centroid.json");
        // id 2 name
        this.id2name = {};
        for (let e of this.geojson["features"]) {
            this.id2name[e["properties"]["locationid"]] = e["properties"]["zone"];
        }
        // projection
        this.projection = {
            center: [-74.1, 40.72],
            scale: 70000,
            projGenerator: d3.geoMercator(),
            get_projection: function () {
                return this.projGenerator
                    .center(this.center)
                    .scale(this.scale)
                    .translate([that.svgWidth / 2, that.svgHeight / 2]);
            }
        };
        // pan zoom
        // let zoom = d3.zoom()
        //     .scaleExtent([1, 5])
        //     .on("zoom", function () {
        //         that.mapCanvas.attr("transform", d3.event.transform);
        //     });
        // this.pan_zoom_rect.call(zoom);

        // color scale
        this.demandColorScale = d3.scaleLinear().range(["red", "brown"]).interpolate(d3.interpolateHcl).nice();
        this.ySupplyColorScale = d3.scaleLinear().range(["steelblue", "yellow"]).interpolate(d3.interpolateHcl).nice();
        this.gSupplyColorScale = d3.scaleLinear().range(["green", "brown"]).interpolate(d3.interpolateHcl).nice();

        this.legendAxisScale = d3.scaleLinear().range([0, this.legendDim.width]).nice();


    };

    // update data
    update() {
        let type = (g_COM["filter"].filter)["type"];
        let avg_supply_demand = g_dataManager.get_avg_supply_demand();
        if (type["yellow"] == 1) {
            if (type["supply"] == 1) {
                this.filtered_data = avg_supply_demand["yellow"]["supply"];
                this.legendColorScale = this.ySupplyColorScale;
            } else if (type["demand"] == 1) {
                this.filtered_data = avg_supply_demand["yellow"]["demand"];
                this.legendColorScale = this.demandColorScale;
            }
        } else if (type["green"] == 1) {
            if (type["supply"] == 1) {
                this.filtered_data = avg_supply_demand["green"]["supply"];
                this.legendColorScale = this.ySupplyColorScale;
            } else if (type["demand"] == 1) {
                this.filtered_data = avg_supply_demand["green"]["demand"];
                this.legendColorScale = this.demandColorScale;
            }
        }
    };

    draw_legend() {
        // clear
        this.legend.selectAll("*").remove();

        let gradient = this.legend.append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .attr("spreadMethod", "pad");

        this.legend.append("rect")
            .attr("width", this.legendDim.width)
            .attr("height", this.legendDim.height)
            .style("fill", "url(#gradient)");

        let legendAxisGrp = this.legend.append("g")
            .attr("transform", "translate(" + 0 + "," + this.legendDim.height + ")");

        // update gradient
        for (let i = 0; i <= 10; i++) {
            let percent = (10 * i) + "%";
            let value = this.legendAxisScale.invert(0.1 * i * this.legendDim.width);
            let color = d3.rgb(this.legendColorScale(value));
            let opacity = 1;
            gradient.append("stop")
                .attr("offset", percent)
                .attr("stop-color", color)
                .attr("stop-opacity", opacity);
        }

        // draw axis
        let legendAxis = d3.axisBottom().scale(this.legendAxisScale);
        legendAxisGrp.call(legendAxis);
    }

    // draw zones
    draw_paths() {
        let that = this;
        // draw map paths
        let zoneGrps = this.mapCanvas.selectAll("g").data(this.geojson.features);
        zoneGrps.exit().remove();
        zoneGrps = zoneGrps.enter().append("g").merge(zoneGrps);

        let pathGenerator = d3.geoPath().projection(this.projection.get_projection());

        zoneGrps.append("path")
            .attr("d", pathGenerator)
            .classed("zone", true)
            .attr("id", d => "locid" + d["properties"]["locationid"])
            .attr("fill", function (d) {
                let id = d["properties"]["locationid"] - 1;
                let value = that.filtered_data[id];
                return that.legendColorScale(value);
            })
            .on("mouseover", function (d) {
                // show zone information
                if (that.singleSelection == 0)
                    g_COM.zone_stat.show(d);
            })
            .on("mouseout", function (d) {
                if (that.singleSelection == 0)
                    g_COM.zone_stat.hide();
            })
            .on("click", function (d) {
                let loc_id = d["properties"]["locationid"];
                let path = d3.select("#locid" + loc_id);
                if (loc_id == that.singleSelection) {
                    that.singleSelection = 0;
                    g_COM.zone_stat.hide();
                    path.classed("single-selection", false);

                    // hide routes
                    that.hide_routes();
                } else {
                    let old_path = d3.select("#locid" + that.singleSelection);
                    that.singleSelection = loc_id;
                    g_COM.zone_stat.show(d);
                    old_path.classed("single-selection", false);
                    path.classed("single-selection", true);
                    that.hide_routes();
                    // show routes
                    that.show_routes(loc_id);
                }
            })
            .on("contextmenu", function (d) {
                d3.event.preventDefault();
                let loc_id = d["properties"]["locationid"];
                let path = d3.select("#locid" + loc_id);
                let idx = that.multipleSelection.indexOf(loc_id);
                if (idx != -1) {
                    that.multipleSelection.splice(idx, 1);
                    path.classed("multiple-selection", false);
                } else {
                    that.multipleSelection.push(loc_id);
                    path.classed("multiple-selection", true);
                }
            });
    };

    // show routes
    show_routes(loc_id) {
        let num_loc = g_COM["cfg"]["num_loc"];
        for (let id = 1; id <= num_loc; id++) {
            this.routeCanvas.select(".route" + loc_id + "-" + id).classed("show", true);
            this.routeCanvas.select(".route" + id + "-" + loc_id).classed("show", true);
        }
    };
    // hide routes
    hide_routes() {
        this.routeCanvas.selectAll("line").classed("show", false);
    };


    // draw routes
    draw_routes() {
        let that = this;
        // get routes
        let all_routes = g_dataManager.get_routes();
        let type = g_COM.filter.filter["type"];
        let routes = null;
        if (type["yellow"] == 1)
            routes = all_routes["yellow"];
        else if (type["green"] == 1)
            routes = all_routes["green"];
        // draw map paths
        this.routeCanvas.selectAll("*").remove();
        // projection
        let proj = this.projection.get_projection();
        let points = {};
        for (let i in this.centroid) {
            let p = this.centroid[i];
            let p1 = [p.x, p.y];
            points[i] = proj(p1);
        }

        // draw lines
        routes.forEach(function (d) {
            let p1 = points[d[0]];
            let p2 = points[d[1]];
            if (p1 != undefined && p2 != undefined)
                that.routeCanvas.append("line")
                .attr("x1", p1[0])
                .attr("y1", p1[1])
                .attr("x2", p2[0])
                .attr("y2", p2[1])
                .classed("route" + d[0] + "-" + d[1], true)
                .classed("route" + d[1] + "-" + d[0], true)
                .classed("route", true)
                .on("mouseover", function () {
                    if (that.routeSelection[0] == 0)
                        that.show_route_info(d[0], d[1]);
                })
                .on("mouseout", function () {
                    if (that.routeSelection[0] == 0)
                        that.hide_route_info();
                })
                .on("click", function () {
                    
                    if (that.routeSelection[0] == 0) {
                        that.show_route_info(d[0], d[1]);
                        that.routeSelection[0] = Math.min(d[0], d[1]);
                        that.routeSelection[1] = d[0] + d[1] - that.routeSelection[0];
                        d3.select("#loc"+that.routeSelection[0]+"-"+that.routeSelection[1]).classed("select",true);
                    } else {
                        that.hide_route_info();
                         d3.select("#loc"+that.routeSelection[0]+"-"+that.routeSelection[1]).classed("select",false);
                        if (that.routeSelection[0] == Math.min(d[0], d[1]) && that.routeSelection[1] == Math.max(d[0], d[1])) {
                            that.routeSelection = [0 ,0];
                        } else {
                            that.show_route_info(d[0], d[1]);
                            that.routeSelection[0] = Math.min(d[0], d[1]);
                            that.routeSelection[1] = d[0] + d[1] - that.routeSelection[0];
                            d3.select("#loc"+that.routeSelection[0]+"-"+that.routeSelection[1]).classed("select",true);
                        }

                    }
                });
        });

    };

    // show route info
    show_route_info(id1, id2) {
        // clear
        d3.select("#route-info").selectAll("*").remove();
        // get data
        let trip_data = g_dataManager.get_trip_data();
        let type = g_COM.filter.filter["type"];
        if (type["yellow"] == 1) {
            trip_data = trip_data["yellow"]["daily_data"];
        } else if (type["green"] == 1) {
            trip_data = trip_data["green"]["daily_data"];
        }

        let num_slot = trip_data.length;
        let loc1 = this.id2name[id1];
        let loc2 = this.id2name[id2];

        let d12 = 0;
        let t12 = 0;
        let m12 = 0;
        let d21 = 0;
        let t21 = 0;
        let m21 = 0;

        id1 -= 1;
        id2 -= 1;
        for (let i = 0; i < num_slot; i++) {
            d12 += trip_data[i]["trip_dist"][id1][id2];
            t12 += trip_data[i]["trip_time"][id1][id2];
            m12 += trip_data[i]["total_amount"][id1][id2];

            d21 += trip_data[i]["trip_dist"][id2][id1];
            t21 += trip_data[i]["trip_time"][id2][id1];
            m21 += trip_data[i]["total_amount"][id2][id1];
        }
        d12 /= num_slot;
        t12 /= num_slot;
        m12 /= num_slot;

        d21 /= num_slot;
        t21 /= num_slot;
        m21 /= num_slot;
        d3.select("#route-info").append("span").html(d12 + " " + t12 + " " + m12);
        d3.select("#route-info").append("span").html(d21 + " " + t21 + " " + m21);
        // let chart = c3.generate({
        //     size: {
        //         width: 500,
        //         height: 300
        //     },
        //     bindto: "#route-info",
        //     data: {
        //         x: "slot",
        //         columns: [x, d12, d21, m12, m21],
        //         axes: {
        //             dist_1_to_2: "y",
        //             dist_2_to_1: "y",
        //             cost_1_to_2: "y2",
        //             cost_2_to_1: "y2"
        //         },
        //         type: "line",
        //         types: {
        //             dist_1_to_2: "bar",
        //             dist_2_to_1: "bar"
        //         }
        //     },
        //     axis: {
        //         x: {
        //             // type:"timeseries",
        //             tick: {
        //                 format: function (x) {
        //                     let minutes = x * 10;
        //                     let hour = Math.floor(minutes / 60);
        //                     minutes = minutes % 60;

        //                     if (minutes == 0) {
        //                         return hour + ":00";
        //                     } else
        //                         return hour + ":" + minutes;

        //                 }
        //             }
        //         },
        //         y2: {
        //             show: true,
        //             tick:{
        //                 format: d3.format("$")
        //             }
        //         }
        //     },
        //     tooltip: {
        //         format: {
        //             title: function(){
        //                 return "1: " + t1 +" 2: " + t2;
        //             },
        //             value: function (value, ratio, id) {
        //                 if (id == "dist_1_to_2" || id == "dist_2_to_1")
        //                     return d3.format(".2f")(value) + " m";
        //                 else
        //                     return d3.format("$")(value);
        //             }
        //         }
        //     }

        // });


    };
    // hide route info
    hide_route_info() {
        d3.select("#route-info").selectAll("*").remove();
    }


    // render view
    show() {
        let that = this;
        // config scales
        let min_V = 0;
        let max_V = d3.max(this.filtered_data);

        this.legendColorScale.domain([min_V, max_V]);
        this.legendAxisScale.domain([min_V, max_V]);
        // draw map legend
        this.draw_legend();
        // draw map paths
        this.draw_paths();
        // draw routes
        this.draw_routes();



    };


};