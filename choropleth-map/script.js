let body = d3.select("body");

let svg = d3.select("svg");

let tooltip = body.append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);

let path = d3.geoPath();

let x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

let color = d3.scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
    .range(d3.schemeGreens[9]);

let g = svg.append("g")
    .attr("class", "key")
    .attr("id", "legend")
    .attr("transform", "translate(0,40)");

g.selectAll("rect").data(color.range().map((d) => {
        d = color.invertExtent(d);
        if (d[0] === null) d[0] = x.domain()[0]
        if (d[1] === null) d[1] = x.domain()[1];
        return d;
    }))
    .enter()
    .append("rect")
    .attr("height", 8)
    .attr("x", d => x(d[0]))
    .attr("width", d => d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null))
    .attr("fill", d => color(d[0]));

g.append("text").attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold");

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(x => Math.round(x) + "%")
    .tickValues(color.domain()))
    .select(".domain")
    .remove();

const EDUCATION_FILE = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const COUNTY_FILE = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([d3.json(COUNTY_FILE), d3.json(EDUCATION_FILE)])
    .then((data) => ready(data[0], data[1]))
    .catch((err) => console.log(err));

function ready(us, education) {
    svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .attr("data-education", function (d) {
        let result = education.filter(obj => obj.fips === d.id);
        if (result[0]) return result[0].bachelorsOrHigher;
        // Could not find a matching fips id in the data
        console.log("could find data for: ", d.id);
        return 0;
    })
    .attr("fill", function (d) {
        let result = education.filter(obj => obj.fips === d.id);
        if (result[0]) return color(result[0].bachelorsOrHigher);
        // could not find a matching fips id in the data
        return color(0);
    })
    .attr("d", path)
    .on("mouseover", function (event, d) {
        tooltip.style("opacity", 0.9);
        tooltip.html(function () {
            let result = education.filter(obj => obj.fips === d.id);
            if (result[0]) {
            return (
                result[0]["area_name"] +
                ", " +
                result[0]["state"] +
                ": " +
                result[0].bachelorsOrHigher +
                "%"
            );
            }
            // Could not find a matching fips id in the data
            return 0;
        })
        .attr("data-education", function () {
            let result = education.filter(obj => obj.fips === d.id);
            if (result[0]) return result[0].bachelorsOrHigher;
            return 0;
            // Could not find a matching fips id in the data
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

    svg
    .append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("class", "states")
    .attr("d", path);
}
