import { onMount, onCleanup, createEffect } from 'solid-js';
import * as d3 from 'd3';

interface DataPoint {
  date: Date;
  value: number;
}

export function BodyMetricsChart(props: { 
  data: any[], 
  title: string, 
  color?: string,
  projection?: { date: Date, value: number }[] 
}) {
  let containerRef: HTMLDivElement | undefined;

  const renderChart = () => {
    if (!containerRef || !props.data || props.data.length === 0) return;

    // Clear previous
    d3.select(containerRef).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = containerRef.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(containerRef)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data: DataPoint[] = props.data
      .map(d => ({
        date: new Date(d.measuredAt),
        value: d.weightKg || 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const projectionData: DataPoint[] = props.projection || [];

    // Combined domain for X axis
    const allDates = [...data.map(d => d.date), ...projectionData.map(d => d.date)];
    const x = d3.scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, width]);

    // Combined domain for Y axis
    const allValues = [...data.map(d => d.value), ...projectionData.map(d => d.value)];
    const y = d3.scaleLinear()
      .domain([
        Math.min(...allValues) * 0.95,
        Math.max(...allValues) * 1.05
      ])
      .range([height, 0]);

    // Generators
    const area = d3.area<DataPoint>()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const line = d3.line<DataPoint>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const projectionLine = d3.line<DataPoint>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveLinear); // Projection is usually linear deficit

    // Add main gradient
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', props.color || '#00d2ff')
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', props.color || '#00d2ff')
      .attr('stop-opacity', 0);

    // Draw main area & line
    svg.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', props.color || '#00d2ff')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Draw projection line if exists
    if (projectionData.length > 0) {
      svg.append('path')
        .datum(projectionData)
        .attr('fill', 'none')
        .attr('stroke', '#a0a0ab')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5)
        .attr('d', projectionLine);
      
      // Goal Point
      const lastPoint = projectionData[projectionData.length - 1];
      svg.append('circle')
        .attr('cx', x(lastPoint.date))
        .attr('cy', y(lastPoint.value))
        .attr('r', 4)
        .attr('fill', '#a0a0ab');

      svg.append('text')
        .attr('x', x(lastPoint.date) - 5)
        .attr('y', y(lastPoint.value) - 15)
        .attr('fill', '#a0a0ab')
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .text(`GOAL: ${lastPoint.value.toFixed(2)}`);
    }

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10))
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('.tick text').attr('fill', '#a0a0ab').style('font-size', '10px').style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'));

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickPadding(10).tickFormat(d3.format(".2f")))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.05)'))
      .call(g => g.selectAll('.tick text').attr('fill', '#a0a0ab').style('font-size', '10px').style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'));

    // Interaction point
    const focus = svg.append('g')
      .style('display', 'none');

    focus.append('circle')
      .attr('r', 5)
      .attr('fill', props.color || '#00d2ff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    focus.append('text')
      .attr('x', 10)
      .attr('dy', '.31em')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace');

    svg.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => focus.style('display', 'none'))
      .on('mousemove', (event) => {
        const mouseX = d3.pointer(event)[0];
        const date = x.invert(mouseX);
        const bisect = d3.bisector((d: DataPoint) => d.date).left;
        const index = bisect(data, date);
        const d0 = data[index - 1];
        const d1 = data[index];
        const d = (d0 && d1) ? (date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime() ? d1 : d0) : (d1 || d0);
        
        if (d) {
          focus.attr('transform', `translate(${x(d.date)},${y(d.value)})`);
          focus.select('text').text(d.value.toFixed(2));
        }
      });
  };

  onMount(() => {
    renderChart();
    window.addEventListener('resize', renderChart);
  });

  onCleanup(() => {
    window.removeEventListener('resize', renderChart);
  });

  createEffect(() => {
    renderChart();
  });

  return (
    <div class="glass p-6 w-full">
      <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{props.title}</h3>
      <div ref={containerRef} class="w-full h-[300px]"></div>
    </div>
  );
}
