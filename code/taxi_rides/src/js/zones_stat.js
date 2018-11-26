class Zones_Stat {
    constructor() {
    };

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

    show() {
        d3.select("#zones-chart")
            .style("height", "100%");

        d3.select("#charts-button").classed("true", true);
    };
    // hide zones chart
    hide() {
        d3.select("#zones-chart")
            .style("height", "0");

        d3.select("#charts-button").classed("true", false);
    };
}