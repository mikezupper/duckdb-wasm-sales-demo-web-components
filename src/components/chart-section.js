// components/chart-section.js - D3 chart wrapper component
import { LitElement, html } from 'lit';
import * as d3 from 'd3';

export class ChartSection extends LitElement {
    static properties = {
        data: { type: Array },
        badge: { type: String }
    };

    constructor() {
        super();
        this.data = [];
        this.badge = '0 items';
        this._chart = null;
    }

    firstUpdated() {
        // Initialize D3 chart once DOM is ready
        const container = this.querySelector('#chart');
        this._chart = this._initChart(container);
    }

    updated(changedProperties) {
        // Update chart when data changes
        if (changedProperties.has('data') && this._chart) {
            this._chart.update(this.data);
        }
    }

    _initChart(container) {
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
            if (!data || data.length === 0) {
                // Clear chart if no data
                svg.selectAll("rect").remove();
                return;
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

    render() {
        return html`
      <div class="section-header">
        <h2>Sales by Item</h2>
        <span class="badge">${this.badge}</span>
      </div>
      <figure id="chart"></figure>
    `;
    }
}