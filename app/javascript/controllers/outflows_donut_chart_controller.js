import { Controller } from "@hotwired/stimulus";
import * as d3 from "d3";

// Simplified donut chart controller specifically for outflows visualization
// Connects to data-controller="outflows-donut-chart"
export default class extends Controller {
  static targets = ["chartContainer", "contentContainer", "defaultContent"];
  static values = {
    segments: { type: Array, default: [] },
    startDate: String,
    endDate: String,
  };

  #viewBoxSize = 100;
  #innerRadius = 45;
  #outerRadius = 50;
  #hoverOuterRadius = 53;
  #padAngle = 0.01;

  connect() {
    this.#draw();
  }

  disconnect() {
    this.#teardown();
  }

  #teardown() {
    if (this.hasChartContainerTarget) {
      d3.select(this.chartContainerTarget).selectAll("*").remove();
    }
  }

  #draw() {
    if (!this.hasChartContainerTarget || !this.segmentsValue.length) return;

    const svg = d3
      .select(this.chartContainerTarget)
      .append("svg")
      .attr("viewBox", `0 0 ${this.#viewBoxSize} ${this.#viewBoxSize}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("class", "w-full h-full");

    const pie = d3
      .pie()
      .value((d) => d.amount)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(this.#innerRadius)
      .outerRadius(this.#outerRadius)
      .cornerRadius(2)
      .padAngle(this.#padAngle);

    const hoverArc = d3
      .arc()
      .innerRadius(this.#innerRadius - 3)
      .outerRadius(this.#hoverOuterRadius)
      .cornerRadius(2)
      .padAngle(this.#padAngle);

    const g = svg
      .append("g")
      .attr("transform", `translate(${this.#viewBoxSize / 2}, ${this.#viewBoxSize / 2})`);

    const segments = g
      .selectAll(".segment")
      .data(pie(this.segmentsValue))
      .enter()
      .append("g")
      .attr("class", "segment");

    // Add the main colored paths
    const paths = segments
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)  // Directly use the color from data
      .attr("stroke", "var(--color-bg-container)")
      .attr("stroke-width", "0.5")
      .attr("data-segment-id", (d) => d.data.id)
      .attr("data-segment-name", (d) => d.data.name)
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease");

    // Add hover effects
    segments
      .on("mouseenter", (event, d) => {
        // Expand the hovered segment
        d3.select(event.currentTarget)
          .select("path")
          .transition()
          .duration(200)
          .attr("d", hoverArc);

        // Show segment details
        this.#showSegmentDetails(d.data);
      })
      .on("mouseleave", (event) => {
        // Restore original size
        d3.select(event.currentTarget)
          .select("path")
          .transition()
          .duration(200)
          .attr("d", arc);

        // Hide segment details
        this.#hideSegmentDetails();
      })
      .on("click", (event, d) => {
        if (d.data.clickable !== false && this.startDateValue && this.endDateValue) {
          const url = `/transactions?q[categories][]=${encodeURIComponent(d.data.name)}&q[start_date]=${this.startDateValue}&q[end_date]=${this.endDateValue}`;
          window.location.href = url;
        }
      });
  }

  #showSegmentDetails(segment) {
    const template = this.element.querySelector(`#segment_${segment.id}`);
    if (template) {
      this.defaultContentTarget.classList.add("hidden");
      template.classList.remove("hidden");
    }
  }

  #hideSegmentDetails() {
    this.defaultContentTarget.classList.remove("hidden");
    for (const child of this.contentContainerTarget.children) {
      if (child !== this.defaultContentTarget) {
        child.classList.add("hidden");
      }
    }
  }

  // Public method for external highlighting (e.g., from category list hover)
  highlightSegment(event) {
    const segmentId = event.currentTarget.dataset.categoryId;
    const paths = d3.select(this.chartContainerTarget).selectAll("path");
    
    paths
      .style("opacity", function() {
        return this.dataset.segmentId === segmentId ? 1 : 0.3;
      });
  }

  unhighlightSegment() {
    const paths = d3.select(this.chartContainerTarget).selectAll("path");
    paths.style("opacity", 1);
  }
}
