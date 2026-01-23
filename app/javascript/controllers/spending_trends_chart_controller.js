import { Controller } from "@hotwired/stimulus";
import * as d3 from "d3";

// Connects to data-controller="spending-trends-chart"
export default class extends Controller {
  static values = {
    data: Array, // Array of {month, expenses, income}
  };

  _d3SvgMemo = null;
  _d3GroupMemo = null;
  _d3Tooltip = null;
  _d3InitialContainerWidth = 0;
  _d3InitialContainerHeight = 0;
  _resizeObserver = null;

  connect() {
    this._install();
    document.addEventListener("turbo:load", this._reinstall);
    this._setupResizeObserver();
  }

  disconnect() {
    this._teardown();
    document.removeEventListener("turbo:load", this._reinstall);
    this._resizeObserver?.disconnect();
  }

  _reinstall = () => {
    this._teardown();
    this._install();
  };

  _teardown() {
    this._d3SvgMemo = null;
    this._d3GroupMemo = null;
    this._d3Tooltip = null;

    this._d3Container.selectAll("*").remove();
  }

  _install() {
    this._rememberInitialContainerSize();
    this._draw();
  }

  _rememberInitialContainerSize() {
    this._d3InitialContainerWidth = this._d3Container.node().clientWidth;
    this._d3InitialContainerHeight = this._d3Container.node().clientHeight;
  }

  _draw() {
    const minWidth = 50;
    const minHeight = 50;

    if (
      this._d3ContainerWidth < minWidth ||
      this._d3ContainerHeight < minHeight
    ) {
      return;
    }

    if (!this.dataValue || this.dataValue.length === 0) {
      this._drawEmpty();
    } else {
      this._drawChart();
    }
  }

  _drawEmpty() {
    this._d3Svg
      .append("text")
      .attr("x", this._d3InitialContainerWidth / 2)
      .attr("y", this._d3InitialContainerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("class", "fg-subdued text-sm")
      .style("fill", "currentColor")
      .text("No spending data available");
  }

  _drawChart() {
    this._drawBars();
    this._drawAreaGradient();
    this._drawLine();
    this._drawAxes();
    this._drawTooltip();
    this._trackMouseForShowingTooltip();
  }

  _drawBars() {
    const barWidth = this._d3ContainerWidth / this.dataValue.length;
    const padding = barWidth * 0.2;

    this._d3Group
      .selectAll(".bar")
      .data(this.dataValue)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => i * barWidth + padding / 2)
      .attr("y", (d) => this._d3YScale(d.expenses))
      .attr("width", barWidth - padding)
      .attr(
        "height",
        (d) => this._d3ContainerHeight - this._d3YScale(d.expenses),
      )
      .attr("fill", "var(--color-warning)")
      .attr("opacity", 0.2)
      .attr("rx", 4);
  }

  _drawAreaGradient() {
    // Define gradient for area fill
    const gradient = this._d3Group
      .append("defs")
      .append("linearGradient")
      .attr("id", `${this.element.id}-area-gradient`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "var(--color-warning)")
      .attr("stop-opacity", 0.3);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "var(--color-warning)")
      .attr("stop-opacity", 0);

    // Draw area under the line
    const area = d3
      .area()
      .x((d, i) => (i * this._d3ContainerWidth) / (this.dataValue.length - 1))
      .y0(this._d3ContainerHeight)
      .y1((d) => this._d3YScale(d.expenses))
      .curve(d3.curveMonotoneX);

    this._d3Group
      .append("path")
      .datum(this.dataValue)
      .attr("class", "area")
      .attr("fill", `url(#${this.element.id}-area-gradient)`)
      .attr("d", area);
  }

  _drawLine() {
    const line = d3
      .line()
      .x((d, i) => (i * this._d3ContainerWidth) / (this.dataValue.length - 1))
      .y((d) => this._d3YScale(d.expenses))
      .curve(d3.curveMonotoneX);

    this._d3Group
      .append("path")
      .datum(this.dataValue)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "var(--color-warning)")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
  }

  _drawAxes() {
    // X-axis
    const xAxis = d3
      .axisBottom(this._d3XScale)
      .tickFormat((d, i) => this.dataValue[i]?.month || "")
      .tickSize(0)
      .tickPadding(10);

    this._d3Group
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this._d3ContainerHeight})`)
      .call(xAxis)
      .select(".domain")
      .remove();

    this._d3Group
      .selectAll(".x-axis text")
      .attr("class", "fg-subdued text-xs")
      .style("fill", "currentColor");

    // Y-axis with grid lines
    const yAxis = d3
      .axisLeft(this._d3YScale)
      .ticks(5)
      .tickSize(-this._d3ContainerWidth)
      .tickFormat((d) => this._formatCurrency(d));

    this._d3Group
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .select(".domain")
      .remove();

    this._d3Group
      .selectAll(".y-axis text")
      .attr("class", "fg-subdued text-xs")
      .style("fill", "currentColor");

    this._d3Group
      .selectAll(".y-axis line")
      .attr("stroke", "var(--color-gray-200)")
      .attr("stroke-dasharray", "2,2");
  }

  _drawTooltip() {
    this._d3Tooltip = d3
      .select(`#${this.element.id}`)
      .append("div")
      .attr(
        "class",
        "bg-container text-sm font-sans absolute p-3 border border-secondary rounded-lg pointer-events-none opacity-0 shadow-lg",
      );
  }

  _trackMouseForShowingTooltip() {
    const bisect = d3.bisector((d, x) => {
      const dataIndex = this.dataValue.indexOf(d);
      const dataX =
        (dataIndex * this._d3ContainerWidth) / (this.dataValue.length - 1);
      return dataX - x;
    }).left;

    this._d3Group
      .append("rect")
      .attr("class", "bg-container")
      .attr("width", this._d3ContainerWidth)
      .attr("height", this._d3ContainerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", (event) => {
        const [xPos, yPos] = d3.pointer(event);

        // Find closest data point
        let closestIndex = 0;
        let minDistance = Number.POSITIVE_INFINITY;

        this.dataValue.forEach((d, i) => {
          const dataX =
            (i * this._d3ContainerWidth) / (this.dataValue.length - 1);
          const distance = Math.abs(dataX - xPos);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        });

        const d = this.dataValue[closestIndex];
        const dataX =
          (closestIndex * this._d3ContainerWidth) / (this.dataValue.length - 1);

        // Clear previous circles and guidelines
        this._d3Group.selectAll(".data-point-circle").remove();
        this._d3Group.selectAll(".guideline").remove();

        // Draw vertical guideline
        this._d3Group
          .append("line")
          .attr("class", "guideline")
          .attr("x1", dataX)
          .attr("y1", 0)
          .attr("x2", dataX)
          .attr("y2", this._d3ContainerHeight)
          .attr("stroke", "var(--color-gray-400)")
          .attr("stroke-dasharray", "4,4");

        // Draw circle at data point
        this._d3Group
          .append("circle")
          .attr("class", "data-point-circle")
          .attr("cx", dataX)
          .attr("cy", this._d3YScale(d.expenses))
          .attr("r", 6)
          .attr("fill", "var(--color-warning)")
          .attr("stroke", "white")
          .attr("stroke-width", 2);

        // Position and show tooltip
        const tooltipX = event.pageX + 10;
        const tooltipY = event.pageY - 10;

        this._d3Tooltip
          .html(this._tooltipTemplate(d))
          .style("opacity", 1)
          .style("z-index", 999)
          .style("left", `${tooltipX}px`)
          .style("top", `${tooltipY}px`);
      })
      .on("mouseout", () => {
        this._d3Group.selectAll(".guideline").remove();
        this._d3Group.selectAll(".data-point-circle").remove();
        this._d3Tooltip.style("opacity", 0);
      });
  }

  _tooltipTemplate(datum) {
    return `
      <div style="margin-bottom: 6px; font-weight: 600; color: var(--color-primary);">
        ${datum.month}
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-4">
          <span style="color: var(--color-destructive);">Expenses:</span>
          <span style="font-weight: 600;">${this._formatCurrency(datum.expenses)}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span style="color: var(--color-success);">Income:</span>
          <span style="font-weight: 600;">${this._formatCurrency(datum.income)}</span>
        </div>
        <div class="flex items-center justify-between gap-4 pt-1 border-t border-gray-200">
          <span>Net:</span>
          <span style="font-weight: 600; color: ${datum.income - datum.expenses >= 0 ? "var(--color-success)" : "var(--color-destructive)"};">
            ${this._formatCurrency(datum.income - datum.expenses)}
          </span>
        </div>
      </div>
    `;
  }

  _formatCurrency(value) {
    // Simple formatting - in production this should match the backend formatting
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${Math.round(value)}`;
  }

  _createMainSvg() {
    return this._d3Container
      .append("svg")
      .attr("width", this._d3InitialContainerWidth)
      .attr("height", this._d3InitialContainerHeight)
      .attr("viewBox", [
        0,
        0,
        this._d3InitialContainerWidth,
        this._d3InitialContainerHeight,
      ]);
  }

  _createMainGroup() {
    return this._d3Svg
      .append("g")
      .attr("transform", `translate(${this._margin.left},${this._margin.top})`);
  }

  get _d3Svg() {
    if (!this._d3SvgMemo) {
      this._d3SvgMemo = this._createMainSvg();
    }
    return this._d3SvgMemo;
  }

  get _d3Group() {
    if (!this._d3GroupMemo) {
      this._d3GroupMemo = this._createMainGroup();
    }
    return this._d3GroupMemo;
  }

  get _margin() {
    return { top: 20, right: 20, bottom: 40, left: 60 };
  }

  get _d3ContainerWidth() {
    return (
      this._d3InitialContainerWidth - this._margin.left - this._margin.right
    );
  }

  get _d3ContainerHeight() {
    return (
      this._d3InitialContainerHeight - this._margin.top - this._margin.bottom
    );
  }

  get _d3Container() {
    return d3.select(this.element);
  }

  get _d3XScale() {
    return d3
      .scaleLinear()
      .domain([0, this.dataValue.length - 1])
      .range([0, this._d3ContainerWidth]);
  }

  get _d3YScale() {
    const maxExpenses = d3.max(this.dataValue, (d) => d.expenses);
    const maxIncome = d3.max(this.dataValue, (d) => d.income);
    const maxValue = Math.max(maxExpenses, maxIncome);

    return d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([this._d3ContainerHeight, 0]);
  }

  _setupResizeObserver() {
    this._resizeObserver = new ResizeObserver(() => {
      this._reinstall();
    });
    this._resizeObserver.observe(this.element);
  }
}
