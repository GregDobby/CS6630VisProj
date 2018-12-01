class Filter {

    constructor(g_COM, g_dataManager) {
        this.COM = g_COM;
        this.dataManager = g_dataManager;
        // default filter
        this.filter = {
            'date': '01-01-2018',
            'start_slot': 0,
            'end_slot': 20,
            'type': {
                'yellow': 1,
                'green': 0,
                'supply': 1,
                'demand': 0
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

        let num_slot = g_COM["cfg"]["num_slot"];
        for(let i = 0; i < num_slot; i++){
            let minutes = i * 10;
            let hour = Math.floor(minutes / 60);
            minutes = minutes % 60;
            let text = minutes == 0? hour+":00" : hour+":" +minutes;
            d3.select("#start-time")
            .append("option")
            .attr("value", i)
            .html(text);
            d3.select("#end-time")
            .append("option")
            .attr("value", i)
            .html(text);
        }
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
    async update() {
        await g_dataManager.load_data(this.filter);
        console.log(this.filter);
        g_COM.map.update();
        g_COM.map.show();
    };
}