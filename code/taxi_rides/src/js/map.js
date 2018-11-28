class Map {
    constructor() {

        this.margin = {
            v: 20,
            h: 20
        };

        this.legendDim = {
            width: 500,
            height: 30
        };

        let mapView = d3.select("#map-view");
        let boudingRect = mapView.node().getBoundingClientRect();

        this.svgWidth = boudingRect.width - this.margin.h;
        this.svgHeight = boudingRect.height - this.margin.v;

        this.mapViewSvg = mapView.append("svg")
            .style("width", this.svgWidth)
            .style("height", this.svgHeight);



        this.legend = this.mapViewSvg.append("g");


        this.mapCanvas = this.mapViewSvg.append("g");
        this.pan_zoom_rect = this.mapCanvas.append("rect")
            .style("width", this.svgWidth)
            .style("height", this.svgHeight)
            .style("fill", "none")
            .style("pointer-events", "all");
        // map json
        this.geojson = null;
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

        this.stat_zone =null;
    };
    // initlization
    async init() {
        let that = this;
        // load geojson
        this.geojson = await d3.json("../data/map_data/taxi_zone_geojson.json");

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

    render_legend() {
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
            let opacity = 0.2 + 0.08 * i;
            gradient.append("stop")
                .attr("offset", percent)
                .attr("stop-color", color)
                .attr("stop-opacity", opacity);
        }

        // draw axis
        let legendAxis = d3.axisBottom().scale(this.legendAxisScale);
        legendAxisGrp.call(legendAxis);
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
        this.render_legend();


        // draw map paths
        let zoneGrps = this.mapCanvas.selectAll("g").data(this.geojson.features);
        zoneGrps.exit().remove();
        zoneGrps = zoneGrps.enter().append("g").merge(zoneGrps);

        let pathGenerator = d3.geoPath().projection(this.projection.get_projection());

        zoneGrps.append("path")
            .attr("d", pathGenerator)
            .classed("zone", true)
            .attr("fill", function (d) {
                let id = d["properties"]["locationid"] - 1;
                let value = that.filtered_data[id];
                return that.legendColorScale(value);
            })
            .on("mouseover", function (d) {
                // show zone information
                d3.select("#zone-id").html(d["properties"]["locationid"]);
                d3.select("#zone-name").html(d["properties"]["zone"]);
                d3.select("#borough").html(d["properties"]["borough"]);
                d3.select("#zone-chart").style("opacity", 1);



                ///
                let get_trip_data_by_loc_id = g_dataManager.get_trip_data_by_loc_id(d["properties"]["locationid"]);
                //console.log(get_trip_data_by_loc_id[0]);
                this.stat_zone = get_trip_data_by_loc_id[0].yellow.monthly_data;
                //console.log(this.stat_zone);
                //pie
                let data = [
            {
                name: "extra",
                value: math.mean(this.stat_zone.extra)
            },
            {
                name: "fare_amount",
                value: math.mean(this.stat_zone.fare_amount)
            },
            {
                name: "mta_tax",
                value: math.mean(this.stat_zone.mta_tax)
            },
            {
                name: "tip_amount",
                value: math.mean(this.stat_zone.tip_amount)
            },
            {
                name: "tolls_amount",
                value: math.mean(this.stat_zone.tolls_amount)
            }
        ];
        let width = 300;
        let height = 200;
        let radius = Math.min(width, height) / 2 - 10;

        let svg = d3.select("#zone-id").append('svg')
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // A color scale for each of the slices
        let color = d3.scaleOrdinal()
            .range(['#b3e2cd',
                '#fdcdac',
                '#cbd5e8',
                '#f4cae4',
                '#e6f5c9']);

        let pie = d3.pie();

        pie.value(function (d) {
            return d.value;
        });
        let pieData = pie(data);
        //console.log('pieData:', pieData);

        let arc = d3.arc();

        arc.outerRadius(radius);
        arc.innerRadius(0);

        //console.log('first arc:', arc(pieData[0]));
        let groups = svg.selectAll("g").data(pieData)
            .enter()
            .append("g");

        groups.append("path")
            .attr("d", arc)
            .style("fill", d => color(d.data.name));
        groups.append("text")
            .text(d => d.data.name)
            .attr("transform", d => "translate(" + arc.centroid(d) + ")")
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .style("font-size", "10px");





            })
            .on("mouseout", function (d) {
                d3.select("#zone-chart").style("opacity", 0);
                //d3.select("#zone-chart").selectAll("svg").remove();
            });
    };


};