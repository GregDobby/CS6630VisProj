class Zones_Stat {

  constructor() {
    this.stat = null;
    this.lookup = null;
  }

  init() {
    let that = this;
    //   charts button click
    d3.select("#charts-button")
      .on("click", function () {
        g_COM.filter.hide();
        that.show(g_COM.map.multipleSelection);
      });
    d3.select("#zones-chart-closebtn")
      .on("click", function () {
        that.hide();
      });
  };

  update() {};

  show(selection) {
    d3.select("#zones-chart")
      .style("height", "100%");

    // check filter
    let data_list = [];
    // get data

    for (let loc_id of selection) {
      data_list.push(g_dataManager.get_trip_data_by_loc_id(loc_id));
    }
    let header = this.get_header(selection);
    let num_trip = this.get_num_trip(data_list, header);
    let finance = this.get_finance(data_list, header);
    let supply = this.get_supply(data_list, header);
    let demand = this.get_demand(data_list, header);

    this.draw_num_trip(num_trip);
    this.draw_finance(finance);
    this.draw_supply(supply);
    this.draw_demand(demand);

  };

  draw_num_trip(num_trip) {
    c3.generate({
      bindto: "#num_trip",
      size: {
        width: 700,
        height: 250
      },
      data: {
        x: "slot",
        rows: num_trip,
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
          show: false
        },
        y: {
          show: true
        }
      }
    });
  };

  draw_finance(finance) {
    c3.generate({
      bindto: "#finance",
      size: {
        width: 700,
        height: 250
      },
      data: {
        x: "slot",
        rows: finance,
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
          show: false
        },
        y: {
          show: true,
          tick:{
            format: d3.format("$")
          }
        }
      },
      tooltip: {
        format: {
          value: function (value, ratio, id) {
            return d3.format("$")(d3.format(".2f")(value));
          }
        }
      }
    });
  };

  draw_supply(supply){
     c3.generate({
      bindto: "#supply",
      size: {
        width: 700,
        height: 250
      },
      data: {
        x: "slot",
        rows: supply,
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
          show: false
        },
        y: {
          show: true
        }
      }
    });
  };

  draw_demand(demand){
     c3.generate({
      bindto: "#demand",
      size: {
        width: 700,
        height: 250
      },
      data: {
        x: "slot",
        rows: demand,
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
          show: false
        },
        y: {
          show: true
        }
      }
    });
  };


  get_header(selection) {
    let header = [];
    for (let id of selection) {
      header.push(g_COM.map.id2name[id]);
    }
    header.push("slot");

    return header;
  };

  get_num_trip(data_list, header) {
    let num_loc = data_list.length;
    let chart_data = [header];
    let num_slot = g_COM.filter.filter["end_slot"] - g_COM.filter.filter["start_slot"] + 1;
    let type = g_COM.filter.filter["type"];
    for (let i = 0; i < num_slot; i++) {
      let row = [];
      for (let j = 0; j < num_loc; j++) {
        if (type["yellow"] == 1)
          row.push(d3.sum(data_list[j][i]["yellow"]["daily_data"]["num_trip"]));
        else
          row.push(d3.sum(data_list[j][i]["green"]["daily_data"]["num_trip"]));

      }
      row.push(data_list[0][i]["slot"]);
      chart_data.push(row);
    }
    return chart_data;
  }

  get_finance(data_list, header) {
    let num_loc = data_list.length;
    let chart_data = [header];
    let num_slot = g_COM.filter.filter["end_slot"] - g_COM.filter.filter["start_slot"] + 1;
    let type = g_COM.filter.filter["type"];
    for (let i = 0; i < num_slot; i++) {
      let row = [];
      for (let j = 0; j < num_loc; j++) {
        if (type["yellow"] == 1)
          row.push(d3.sum(data_list[j][i]["yellow"]["daily_data"]["total_amount"]));
        else
          row.push(d3.sum(data_list[j][i]["green"]["daily_data"]["total_amount"]));

      }
      row.push(data_list[0][i]["slot"]);
      chart_data.push(row);
    }
    return chart_data;
  };

  get_supply(data_list, header) {
    let num_loc = data_list.length;
    let chart_data = [header];
    let num_slot = g_COM.filter.filter["end_slot"] - g_COM.filter.filter["start_slot"] + 1;
    let type = g_COM.filter.filter["type"];
    for (let i = 0; i < num_slot; i++) {
      let row = [];
      for (let j = 0; j < num_loc; j++) {
        let loc_id = data_list[j][i]["loc_id"]
        if (type["yellow"] == 1)
          row.push(data_list[j][i]["yellow"]["daily_data"]["supply"][loc_id]);
        else
          row.push(data_list[j][i]["green"]["daily_data"]["supply"][loc_id]);

      }
      row.push(data_list[0][i]["slot"]);
      chart_data.push(row);
    }
    return chart_data;
  };

  get_demand(data_list, header) {
    let num_loc = data_list.length;
    let chart_data = [header];
    let num_slot = g_COM.filter.filter["end_slot"] - g_COM.filter.filter["start_slot"] + 1;
    let type = g_COM.filter.filter["type"];
    for (let i = 0; i < num_slot; i++) {
      let row = [];
      for (let j = 0; j < num_loc; j++) {
        let loc_id = data_list[j][i]["loc_id"]
        if (type["yellow"] == 1)
          row.push(data_list[j][i]["yellow"]["daily_data"]["demand"][loc_id]);
        else
          row.push(data_list[j][i]["green"]["daily_data"]["demand"][loc_id]);

      }
      row.push(data_list[0][i]["slot"]);
      chart_data.push(row);
    }
    return chart_data;
  };




  // hide zones chart
  hide() {
    d3.select("#zones-chart")
      .style("height", "0");
    d3.select("#zones-chart").selectAll("svg").remove();
    d3.select("#charts-button").classed("true", false);
  };

}