class Zone_Stat {

    constructor() {

    };

    init() {

    };

    update() {

    };

    show(d) {
        let loc_id = d["properties"]["locationid"];
        //d3.select("#zone-id").html(loc_id);
        d3.select("#zone-name").html(d["properties"]["zone"]+ " (" + d["properties"]["borough"]+")");
        //d3.select("#borough").html(d["properties"]["borough"]);
        d3.select("#zone-chart").style("display", "block");
;

        // draw line & bar chart to display supply & demand
        this.draw_supply_demand(loc_id);

        // draw num_trips pie chart
        this.draw_finance(loc_id);


    };

    draw_supply_demand(loc_id) {
        let that = this;
        // get data
        let supply_demand = this.get_supply_demand(loc_id);
        // clear
        d3.select("#zone-supply-demand").selectAll("*").remove();
        let chart = c3.generate({
            bindto: "#zone-supply-demand",
            size:{
                width: 550,
                height: 200
            },
            data: {
                json: supply_demand,
                keys: {
                    x: "slot",
                    value: ["supply", "demand", "balance"]
                },
                types: {
                    balance: 'bar'
                },
                colors: {
                    supply: "#086fad",
                    demand: "#ad081d",
                    balance: "gray"
                },
                color: function (color, d) {
                    if (d.id == "balance") {
                        if (d.value > 0)
                            return "#ffb733"; 
                        else
                            return "#ffedcc";
                    } else
                        return color;
                }
            },
            axis: {
                x: {
                    // type:"timeseries",
                    tick: {
                        format: function (x) {
                            let minutes = x * 10;
                            let hour = Math.floor(minutes / 60);
                            minutes = minutes % 60;

                            if (minutes == 0) {
                                return hour + ":00";
                            } else
                                return hour + ":" + minutes;
                        }
                    }
                }
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: false
                }
            }
        });
    };

    draw_finance(loc_id) {
        let finance_data = this.get_finance(loc_id);
        // clear
        d3.select("#zone-finance-pie").selectAll("*").remove();

        // draw total amount trend
        let linechart = c3.generate({
            size:{
                width: 700,
                height: 250
            },
            bindto: "#zone-finance-line",
            data: {
                json: finance_data,
                keys: {
                    x: "slot",
                    value: ["total_amount", "fare_amount", "tip_amount", "mta_tax", "tolls_amount", "extra"]
                },
                types:{
                    total_amount: "spline",
                    fare_amount: "bar",
                    tip_amount: "bar",
                    mta_tax: "bar",
                    tolls_amount: "bar",
                    extra: "bar"
                },
                colors:{
                    total_amount: "#000099",
                    fare_amount: "#ec7a80",
                    tip_amount: "#ecc97a",
                    mta_tax: "#9dec7a",
                    tolls_amount: "#7a9dec",
                    extra: "#c97aec"
                },
                groups:[["fare_amount", "tip_amount", "mta_tax", "tolls_amount", "extra"]]
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: false
                }
            },
            axis: {
                x: {
                    // type:"timeseries",
                    tick: {
                        format: function (x) {
                            let minutes = x * 10;
                            let hour = Math.floor(minutes / 60);
                            minutes = minutes % 60;

                            if (minutes == 0) {
                                return hour + ":00";
                            } else
                                return hour + ":" + minutes;

                        }
                    }
                }
            },
            tooltip: {
                format: {
                    value: function (value, ratio, id) {
                        return d3.format("$")(value);
                    }
                }
            }
        });

        // draw pie chart
        let donut = c3.generate({
            bindto: "#zone-finance-pie",
            data: {
                json: finance_data,
                keys: {
                    value: ["fare_amount", "tip_amount", "mta_tax", "tolls_amount", "extra"]
                },
                colors:{
                    fare_amount: "#ec7a80",
                    tip_amount: "#ecc97a",
                    mta_tax: "#9dec7a",
                    tolls_amount: "#7a9dec",
                    extra: "#c97aec"
                },
                type: "donut",
                onmouseover: function (d, i) {
                    d3.select("#zone-finance-pie .c3-chart-arcs-title").text(d3.format("$")(d.value));
                },
                onmouseout: function (d, i) {
                    d3.select("#zone-finance-pie .c3-chart-arcs-title").text("Finance");

                }
            },
            donut: {
                title: "Finance"
            }
        });


    };

    get_finance(loc_id) {
        // get data
        let trip_data = g_dataManager.get_trip_data();
        let finance = [];
        let type = g_COM.filter.filter["type"];
        // yellow
        if (type["yellow"] == 1) {
            let daily_data = trip_data["yellow"]["daily_data"];
            let num_slot = daily_data.length;
            for (let i = 0; i < num_slot; i++) {
                let total_amount = 0;
                let fare_amount = 0;
                let tip_amount = 0;
                let mta_tax = 0;
                let tolls_amount = 0;
                let extra = 0;
                let num_loc = daily_data[i]["num_trip"].length;
                let slot = daily_data[i]["slot"];
                for (let j = 0; j < num_loc; j++) {
                    let num = daily_data[i]["num_trip"][loc_id][j];
                    total_amount += daily_data[i]["total_amount"][loc_id][j] * num;
                    fare_amount += daily_data[i]["fare_amount"][loc_id][j] * num;
                    tip_amount += daily_data[i]["tip_amount"][loc_id][j] * num;
                    mta_tax += daily_data[i]["mta_tax"][loc_id][j] * num;
                    tolls_amount += daily_data[i]["tolls_amount"][loc_id][j] * num;
                    extra += daily_data[i]["extra"][loc_id][j] * num;
                }
                finance.push({
                    "slot": slot,
                    "total_amount": total_amount,
                    "fare_amount": fare_amount,
                    "mta_tax": mta_tax,
                    "tip_amount": tip_amount,
                    "tolls_amount": tolls_amount,
                    "extra": extra
                });
            }
        }

        // green
        if (type["green"] == 1) {
            let daily_data = trip_data["green"]["daily_data"];
            let num_slot = daily_data.length;

            for (let i = 0; i < num_slot; i++) {
                let total_amount = 0;
                let fare_amount = 0;
                let tip_amount = 0;
                let mta_tax = 0;
                let tolls_amount = 0;
                let extra = 0;
                let num_loc = daily_data[i]["num_trip"].length;
                let slot = daily_data[i]["slot"];
                for (j = 0; j < num_loc; j++) {
                    let num = daily_data[i]["num_trip"][j];
                    total_amount += daily_data[i]["total_amount"][j] * num;
                    fare_amount += daily_data[i]["fare_mount"][j] * num;
                    tip_amount += daily_data[i]["tip_amount"][j] * num;
                    mta_tax += daily_data[i]["mta_tax"][j] * num;
                    tolls_amount += daily_data[i]["total_amount"][j] * num;
                    extra += daily_data[i]["extra"][j] * num;
                }
                finance.push({
                    "slot": slot,
                    "total_amount": total_amount,
                    "fare_amount": fare_amount,
                    "mta_tax": mta_tax,
                    "tip_amount": tip_amount,
                    "tolls_amount": tolls_amount,
                    "extra": extra
                });
            }
        }

        return finance;
    };

    get_supply_demand(loc_id) {
        let trip_data = g_dataManager.get_trip_data();
        let supply_demand = [];
        let type = g_COM.filter.filter["type"];
        // yellow
        if (type["yellow"] == 1) {
            let daily_data = trip_data["yellow"]["daily_data"];
            let num_slot = daily_data.length;
            for (let i = 0; i < num_slot; i++) {
                supply_demand.push({
                    "slot": daily_data[i]["slot"],
                    "supply": daily_data[i]["supply"][loc_id],
                    "demand": daily_data[i]["demand"][loc_id],
                    "balance": daily_data[i]["supply"][loc_id] - daily_data[i]["demand"][loc_id]
                });
            }
        }
        //green
        if (type["green"] == 1) {
            let daily_data = trip_data["green"]["daily_data"];
            let num_slot = daily_data.length;
            for (let i = 0; i < num_slot; i++) {
                supply_demand.push({
                    "slot": daily_data[i]["slot"],
                    "supply": daily_data[i]["supply"][loc_id],
                    "demand": daily_data[i]["demand"][loc_id],
                    "balance": daily_data[i]["supply"][loc_id] - daily_data[i]["demand"][loc_id]
                });
            }
        }
        return supply_demand;
    };

    hide() {
        d3.select("#zone-chart").style("display", "none");
    };
}