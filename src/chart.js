import * as d3 from "d3";

// Updated chart.js with debug logging
export function initChart(container) {
    const width = 640, height = 360, margin = 44;

    const svg = d3.select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("aria-label", "Bar chart of totals by item")
        .attr("role", "img");

    const x = d3.scaleBand().range([margin, width - margin]).padding(0.2);
    const y = d3.scaleLinear().range([height - margin, margin]);

    const xAxis = svg.append("g").attr("transform", `translate(0,${height - margin})`);
    const yAxis = svg.append("g").attr("transform", `translate(${margin},0)`);

    function update(data) {
        console.log(`Chart: Updating with data (${data.length} items):`, data);
        if (data.length === 0) {
            console.warn('Chart: No data provided - chart will be empty.');
        }

        x.domain(data.map(d => d.item));
        y.domain([0, d3.max(data, d => d.amount) || 0]).nice();

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        const bars = svg.selectAll("rect").data(data, d => d.item);

        bars.join(
            enter => enter.append("rect")
                .attr("x", d => x(d.item))
                .attr("y", d => y(d.amount))
                .attr("width", x.bandwidth())
                .attr("height", d => y(0) - y(d.amount)),
            update => update.transition().duration(400)
                .attr("x", d => x(d.item))
                .attr("y", d => y(d.amount))
                .attr("width", x.bandwidth())
                .attr("height", d => y(0) - y(d.amount)),
            exit => exit.remove()
        );
    }

    return { update };
}