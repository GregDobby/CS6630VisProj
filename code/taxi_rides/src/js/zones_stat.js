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
                that.show();
            });
        d3.select("#zones-chart-closebtn")
            .on("click", function () {
                that.hide();
            });
    };

    update(){
    };

    async show() {
        d3.select("#zones-chart")
            .style("height", "95%");

        d3.select("#zones-chart").append('svg').attr('id','num_trip').attr("height","500").attr("width","1000");

        d3.select("#zones-chart").append('svg').attr('id','trip_time').attr("height","500").attr("width","1000");
        d3.select("#zones-chart").append('svg').attr('id','trip_dist').attr("height","500").attr("width","1000");

        d3.select("#zones-chart").append('svg').attr('id','fare_amount').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','mta_tax').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','tolls_amount').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','tip_amount').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','extra').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','total_amount').attr("height","650").attr("width","800");

  /**
      let get_trip_data_by_loc_id = g_dataManager.get_trip_data_by_loc_id(48);
      let slice_number = 10
      console.log(get_trip_data_by_loc_id[0]);
      console.log(get_trip_data_by_loc_id[0].yellow.monthly_data);
      this.stat = get_trip_data_by_loc_id[0].yellow.monthly_data;


      this.lookup = await d3.json("../data/map_data/taxi_zone_lookup.json")
      let index_name = this.lookup.map(x => x.Zone);
      index_name = index_name.slice(0, slice_number);

      //num_trip
      let index_name_value_num_trip =this.stat.num_trip;
      let sample_num_trip = [];for (let i = index_name.length-1; i >= 0; i--) { let dict = {};dict['name'] = index_name[i];dict['value'] = index_name_value_num_trip[i];sample_num_trip.push(dict);};
      //console.log(sample_num_trip);
      this.barG(index_name_value_num_trip,index_name,sample_num_trip,'City','Times','Number of Trip','#num_trip')

    **/

    this.lookup = await d3.json("../data/map_data/taxi_zone_lookup.json")
    let index_name = this.lookup.map(x => x.Zone);

    let loc_id = [49,50,51,34,123];
    let get_trip_num_trip= [];
    let get_trip_data_dist = [];
    let get_trip_data_time= [];
    let select_name=[];

    for (var i = 0; i<loc_id.length;i ++){
        get_trip_num_trip.push(g_dataManager.get_trip_data_by_loc_id(loc_id[i]).map(x=>x.yellow).map(x=>x.monthly_data).map(x=>x.num_trip));
        get_trip_data_time.push(g_dataManager.get_trip_data_by_loc_id(loc_id[i]).map(x=>x.yellow).map(x=>x.monthly_data).map(x=>x.trip_time));
        get_trip_data_dist.push(g_dataManager.get_trip_data_by_loc_id(loc_id[i]).map(x=>x.yellow).map(x=>x.monthly_data).map(x=>x.trip_dist));
        select_name.push(index_name[i]);
    };

    let total_dist = [];
    let total_time = [];
    let total_num_trip = []
    for (var i = 0; i<loc_id.length;i ++){
        total_dist.push(this.total(get_trip_num_trip[i],get_trip_data_dist[i]));
        total_time.push(this.total(get_trip_num_trip[i],get_trip_data_time[i]));
        total_num_trip.push(this.total(get_trip_num_trip[i],get_trip_num_trip[i]));
    };

    let slot=[];
    for (var i = 0; i<total_num_trip[0].length;i ++){
      slot.push('slot'+i)
    };
    
    let dict_trip=[]
    for (var ii = 0; ii<total_num_trip[0].length;ii ++){
      let d={};
      for (var i = 0; i<loc_id.length;i ++){
          d['timescale'] = slot[ii]
          d[select_name[i]] = total_dist[i][ii];
      }
      dict_trip.push(d);
    };

    console.log(dict_trip);
    console.log(select_name);
    let data = dict_trip;

var trendsText = {'Allerton/Pelham Gardens': 'Allerton/Pelham Gardens', 'Alphabet City': 'Alphabet City', 'Jamaica Bay': 'Jamaica Bay','Newark Airport': 'Newark Airport','Arden Heights':'Arden Heights','Arrochar/Fort Wadsworth':'Arrochar/Fort Wadsworth'};

  // set the dimensions and margins of the graph
  var margin = { top: 20, right: 80, bottom: 30, left: 50 },  
      svg = d3.select('#trip_dist'),
      width = +svg.attr('width') - margin.left - margin.right,
      height = +svg.attr('height') - margin.top - margin.bottom;
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // set the ranges
  var x = d3.scaleBand().rangeRound([0, width]).padding(1),
      y = d3.scaleLinear().rangeRound([height, 0]),
      z = d3.scaleOrdinal(d3.schemeCategory10);


  // define the line
  var line = d3.line()
    .x(function(d) { return x(d.timescale); })
    .y(function(d) { return y(d.total); });

  // scale the range of the data
  z.domain(d3.keys(data[0]).filter(function(key) {
    return key !== "timescale";
  }));

  var trends = z.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {
          timescale: d.timescale,
          total: +d[name]
        };
      })
    };
  });
  console.log(data);
  console.log(trends);

  x.domain(data.map(function(d) { return d.timescale; }));
  y.domain([0, d3.max(trends, function(c) {
    return d3.max(c.values, function(v) {
      return v.total;
    });
  })]);

  // Draw the legend
  var legend = g.selectAll('g')
    .data(trends)
    .enter()
    .append('g')
    .attr('class', 'legend');

  legend.append('rect')
    .attr('x', width - 20)
    .attr('y', function(d, i) { return height / 2 - (i + 1) * 20; })
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function(d) { return z(d.name); });

  legend.append('text')
    .attr('x', width - 8)
    .attr('y', function(d, i) { return height / 2 - (i + 1) * 20 + 10; })
    .text(function(d) { return trendsText[d.name]; });

  // Draw the line
  var trend = g.selectAll(".trend")
    .data(trends)
    .enter()
    .append("g")
    .attr("class", "trend");

  trend.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) { return z(d.name); });

  // Draw the empty value for every point
  var points = g.selectAll('.points')
    .data(trends)
    .enter()
    .append('g')
    .attr('class', 'points')
    .append('text');

  // Draw the circle
  trend
    .style("fill", "#FFF")
    .style("stroke", function(d) { return z(d.name); })
    .selectAll("circle.line")
    .data(function(d){ return d.values })
    .enter()
    .append("circle")
    .attr("r", 5)
    .style("stroke-width", 3)
    .attr("cx", function(d) { return x(d.timescale); })
    .attr("cy", function(d) { return y(d.total); });



  // Draw the axis
  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", "translate(0, " + height + ")")
    .call(d3.axisBottom(x));

  g.append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(y).ticks(10));

  var focus = g.append('g')
    .attr('class', 'focus')
    .style('display', 'none');

  focus.append('line')
    .attr('class', 'x-hover-line hover-line')
    .attr('y1' , 0)
    .attr('y2', height);

  svg.append('rect')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
    .on("mousemove", mousemove)
    .style("opacity", 0);

  var timeScales = data.map(function(name) { return x(name.timescale); });

  function mouseover() {
    focus.style("display", null);
    d3.selectAll('.points text').style("display", null);
  }
  function mouseout() {
    focus.style("display", "none");
    d3.selectAll('.points text').style("display", "none");
  }
  function mousemove() {
    var i = d3.bisect(timeScales, d3.mouse(this)[0], 1);
    var di = data[i-1];
    focus.attr("transform", "translate(" + x(di.timescale) + ",0)");
    d3.selectAll('.points text')
      .attr('x', function(d) { return x(di.timescale) + 15; })
      .attr('y', function(d) { return y(d.values[i-1].total); })
      .text(function(d) { return d.values[i-1].total; })
      .style('fill', function(d) { return z(d.name); });
}








    d3.select("#charts-button").classed("true", true);








    };






    lineG(d3_select){
 

    };


    // hide zones chart
    hide() {
        d3.select("#zones-chart")
            .style("height", "0");
        d3.select("#zones-chart").selectAll("svg").remove();
        d3.select("#charts-button").classed("true", false);
    };

    total(num_trip,distORtime){
        let total=[];
        for(var ii =0; ii<num_trip.length;ii++){
          var ar = [];
          for(var i = 0; i < distORtime[ii].length; i++){
              var valu = distORtime[ii][i] * num_trip[ii][i];
              ar[i] = valu;
          };
          total.push(ar.reduce(function(a, b) { return a + b; }, 0));
        };
        return total;

    };



    barG(index_name_value,index_name,sample,Xname,Yname,title,d3_select) {
        const margin = 20;
        const width = 700 - 2 * margin;
        const height = 500 - 2 * margin;

        const svg = d3.select(d3_select);
        const chart = svg.append('g')
            .attr('transform', `translate(${margin+30}, ${margin})`);
        const yScale = d3.scaleLinear().range([height, 0]).domain([0, Math.max(...index_name_value)]);
        chart.append('g').call(d3.axisLeft(yScale));
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(index_name)
            .padding(0.2);

        chart.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 80)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)");

        const barGroups = chart.selectAll()
            .data(sample)
            .enter()
            .append('g')

        barGroups
            .append('rect')
            .attr('x', (s) => xScale(s.name))
            .attr('y', (s) => yScale(s.value))
            .attr('height', (s) => height - yScale(s.value))
            .attr('width', xScale.bandwidth())
            .on('mouseenter', function (actual, i) {
                d3.selectAll('.value')
                  .attr('opacity', 0)

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 0.6)
                  .attr('x', (a) => xScale(a.name) - 5)
                  .attr('width', xScale.bandwidth() + 10)

                 const y = yScale(actual.value);
                 chart.append('line')
                      .attr('id', 'limit')
                      .attr('x1', 0)
                      .attr('y1', y)
                      .attr('x2', width)
                      .attr('y2', y)
                      .attr('stroke','#FED966');


                 barGroups.append('text')
                    .attr('class', 'divergence')
                    .attr('x', (a) => xScale(a.name) + xScale.bandwidth() / 2)
                    .attr('y', (a) => yScale(a.value) + 30)
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .text((a, idx) => {
                    const divergence = (a.value - actual.value).toFixed(1)
                    
                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}`

                    return idx !== i ? text : '';
                  })
              })
            .on('mouseleave', function () {
                d3.selectAll('.value')
                  .attr('opacity', 1)

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 1)
                  .attr('x', (a) => xScale(a.name))
                  .attr('width', xScale.bandwidth())

                chart.selectAll('#limit').remove()
                chart.selectAll('.divergence').remove()
              });

          barGroups 
            .append('text')
            .attr('class', 'value')
            .attr('x', (a) => xScale(a.name) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.value) + 30)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .text((a) => `${a.value}`);

            svg
              .append('text')
              .attr('class', 'label')
              .attr('x', -(height / 2) - margin)
              .attr('y', margin )
              .attr('transform', 'rotate(-90)')
              .attr('text-anchor', 'middle')
              .text(Yname);

            svg.append('text')
              .attr('class', 'label')
              .attr('x', width / 2 + margin)
              .attr('y', height + margin * 2)
              .attr('text-anchor', 'middle')
              .text(Xname);

            svg.append('text')
              .attr('class', 'title')
              .attr('x', width / 2 + margin)
              .attr('y', 40)
              .attr('text-anchor', 'middle')
              .text(title);


    };









}