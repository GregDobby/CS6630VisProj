class Filter {

    constructor(g_COM) {
        this.COM = g_COM;
        // default filter
        this.filter = {
            'date': '01-01-2018',
            'start_slot': 0,
            'end_slot': 1,
            'type': {
                'yellow': 1,
                'green': 0
            }
        };
    };

    init() {
        let that = this;
        // filter button click
        d3.select("#filter-button")
            .on("click", function () {
                that.show();
            });
        d3.select("#filter-closebtn")
            .on("click", function () {
                that.hide();
            });
    };

    // show filter panel
    show() {
        let percent = "25%";
        d3.select("#filter-panel")
            .style("width", percent);

        d3.select("#main-view")
            .style("margin-left", percent);

        d3.select("#filter-button")
            .style("display", "none");

        d3.select("#filter-button").classed("true", true);
    };

    // hide filter panel
    hide() {
        d3.select("#filter-panel")
            .style("width", "0");

        d3.select("#main-view")
            .style("margin-left", "0");

        d3.select("#filter-button")
            .transition()
            .delay(500)
            .style("display", "block");

        d3.select("#filter-button").classed("true", false);
    };

    // apply filters
    update() {

    };
}