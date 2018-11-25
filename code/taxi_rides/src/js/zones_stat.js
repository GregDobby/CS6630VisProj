class Zones_Stat {
    constructor(g_COM) {
        this.COM = g_COM;
        this.stat = null;
        this.lookup = null;
    }

    init() {
        let that = this;
        //   charts button click
        d3.select("#charts-button")
            .on("click", function () {
                that.COM.filter.hide();
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

        d3.select("#zones-chart").append('svg').attr('id','a').attr("height","650").attr("width","800");
        d3.select("#zones-chart").append('svg').attr('id','b');
        d3.select("#zones-chart").append('svg').attr('id','c');
        d3.select("#zones-chart").append('svg').attr('id','d');



        this.stat = await d3.json("../data/yellow/2018-10minutes/01-stat/slot-0.json");
        console.log(this.stat);
        //console.log(this.stat.trip_time[49]);
        //console.log(Object.keys(this.stat.trip_time[49]));
        this.lookup = await d3.json("../data/map_data/taxi_zone_lookup.json")
        this.lookup = this.lookup.map(x => x.Zone);
        let index_name = [];
        let index_name_value =[];
        for (let i = Object.keys(this.stat.trip_time[49]).length-1; i >= 0; i--) {
            index_name.push(this.lookup[Object.keys(this.stat.trip_time[49])[i]])
            index_name_value.push(Object.values(this.stat.trip_time[49])[i])
        }
        console.log(index_name);
        console.log(index_name_value);
        console.log(Math.max(...index_name_value));

        let sample = []
        for (let i = index_name.length - 1; i >= 0; i--) {
            let dict = {};
            dict['name'] = index_name[i];
            dict['value'] = index_name_value[i]
            sample.push(dict);
        }
        console.log(sample);


        const margin = 20;
        const width = 700 - 2 * margin;
        const height = 500 - 2 * margin;

        const svg = d3.select('#a');
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

                 const y = yScale(actual.value)
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


            svg
              .append('text')
              .attr('class', 'label')
              .attr('x', -(height / 2) - margin)
              .attr('y', margin )
              .attr('transform', 'rotate(-90)')
              .attr('text-anchor', 'middle')
              .text('minutes');

            svg.append('text')
              .attr('class', 'label')
              .attr('x', width / 2 + margin)
              .attr('y', height + margin * 2)
              .attr('text-anchor', 'middle')
              .text('City');

            svg.append('text')
              .attr('class', 'title')
              .attr('x', width / 2 + margin)
              .attr('y', 40)
              .attr('text-anchor', 'middle')
              .text('trip time');









        d3.select("#charts-button").classed("true", true);
    };








    // hide zones chart
    hide() {
        d3.select("#zones-chart")
            .style("height", "0");
        d3.select("#zones-chart").selectAll("svg").remove();
        d3.select("#charts-button").classed("true", false);
    };
}