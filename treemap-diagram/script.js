const DATASETS = {
    videogames: {
        TITLE: "Video Game Sales",
        DESCRIPTION: "Top 100 Most Sold Video Games Grouped by Platform",
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json",
    },
    movies: {
        TITLE: "Movie Sales",
        DESCRIPTION: "Top 100 Highest Grossing Movies Grouped By Genre",
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json",
    },
    kickstarter: {
        TITLE: "Kickstarter Pledges",
        DESCRIPTION: "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json",
    },
};

let urlParams = new URLSearchParams(window.location.search);
const DEFAULT_DATASET = "videogames";
const DATASET = DATASETS[urlParams.get("data") || DEFAULT_DATASET];

document.getElementById("title").innerHTML = DATASET.TITLE;
document.getElementById("description").innerHTML = DATASET.DESCRIPTION;

// Define body
let body = d3.select("body");

// Define the div for the tooltip
let tooltip = body.append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);

let svg = d3.select("#tree-map"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let fader = color => d3.interpolateRgb(color, "#fff")(0.2);

let color = d3.scaleOrdinal().range(
    [
        "#1f77b4",
        "#aec7e8",
        "#ff7f0e",
        "#ffbb78",
        "#2ca02c",
        "#98df8a",
        "#d62728",
        "#ff9896",
        "#9467bd",
        "#c5b0d5",
        "#8c564b",
        "#c49c94",
        "#e377c2",
        "#f7b6d2",
        "#7f7f7f",
        "#c7c7c7",
        "#bcbd22",
        "#dbdb8d",
        "#17becf",
        "#9edae5",
    ].map(fader)
);

let treemap = d3.treemap().size([width, height]).paddingInner(1);

d3.json(DATASET.FILE_PATH)
    .then((data) => {
    let root = d3
        .hierarchy(data)
        .eachBefore(d => d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name)
        .sum(sumBySize)
        .sort((a, b) => b.height - a.height || b.value - a.value);
    
        treemap(root);

    let cell = svg
        .selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("class", "group")
        .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

    cell.append("rect")
        .attr("id", d => d.data.id)
        .attr("class", "tile")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("data-name", d => d.data.name)
        .attr("data-category", d => d.data.category)
        .attr("data-value", d => d.data.value)
        .attr("fill", d => color(d.data.category))
        .on("mousemove", (event, d) => {
            tooltip.style("opacity", 0.9);
            tooltip.html(
                "Name: " +
                d.data.name +
                "<br>Category: " +
                d.data.category +
                "<br>Value: " +
                d.data.value
            )
            .attr("data-value", d.data.value)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    cell.append("text")
        .attr("class", "tile-text")
        .selectAll("tspan")
        .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
        .enter()
        .append("tspan")
        .attr("x", 4)
        .attr("y", (d, i) => 13 + i * 10)
        .text(d => d);

    let categories = root.leaves().map(nodes => nodes.data.category);
    categories = categories.filter((category, index, self) => self.indexOf(category) === index);
    let legend = d3.select("#legend");
    let legendWidth = +legend.attr("width");
    const LEGEND_OFFSET = 10;
    const LEGEND_RECT_SIZE = 15;
    const LEGEND_H_SPACING = 150;
    const LEGEND_V_SPACING = 10;
    const LEGEND_TEXT_X_OFFSET = 3;
    const LEGEND_TEXT_Y_OFFSET = -2;
    let legendElemsPerRow = Math.floor(legendWidth / LEGEND_H_SPACING);

    let legendElem = legend
        .append("g")
        .attr("transform", "translate(60," + LEGEND_OFFSET + ")")
        .selectAll("g")
        .data(categories)
        .enter()
        .append("g")
        .attr("transform", (d, i) => {
            return (
                "translate(" +
                (i % legendElemsPerRow) * LEGEND_H_SPACING +
                "," +
                (Math.floor(i / legendElemsPerRow) * LEGEND_RECT_SIZE + LEGEND_V_SPACING * Math.floor(i / legendElemsPerRow)) +")"
            );
        });

    legendElem
        .append("rect")
        .attr("width", LEGEND_RECT_SIZE)
        .attr("height", LEGEND_RECT_SIZE)
        .attr("class", "legend-item")
        .attr("fill", d => color(d));

    legendElem
        .append("text")
        .attr("x", LEGEND_RECT_SIZE + LEGEND_TEXT_X_OFFSET)
        .attr("y", LEGEND_RECT_SIZE + LEGEND_TEXT_Y_OFFSET)
        .text(d => d);
    })
    .catch(err => console.log(err));

const sumBySize = (d) => d.value;