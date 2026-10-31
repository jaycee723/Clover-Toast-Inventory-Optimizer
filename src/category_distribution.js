/**
 * Category Distribution Analysis & D3 Visualization Engine
 * Computes category variety statistics and provides interactive D3 distribution chart rendering.
 */

/**
 * Maps raw Clover categories or sample item names to standard Toast departments.
 * @param {string} categoryName
 * @param {string[]} sampleItems
 * @returns {string} Toast department name
 */
export function inferToastDepartment(categoryName, sampleItems = []) {
  const text = `${categoryName || ''} ${(sampleItems || []).join(' ')}`.toLowerCase();
  if (/\b(spirit|vodka|whiskey|whisky|bourbon|tequila|rum|gin|cognac|brandy|liqueur|scotch|mezcal)\b/i.test(text)) {
    return 'Liquor / Spirits';
  }
  if (/\b(beer|ale|ipa|lager|pilsner|stout|cider|malt)\b/i.test(text)) {
    return 'Beer & Cider';
  }
  if (/\b(wine|cabernet|chardonnay|merlot|pinot|prosecco|champagne|ros[eé]|sauvignon|moscato)\b/i.test(text)) {
    return 'Wine';
  }
  if (/\b(rtd|seltzers?|hard tea|canned cocktails?|twisted tea|smirnoff ice|high noon|cutwater|truly|white claw)\b/i.test(text)) {
    return 'RTD (Ready to Drink)';
  }
  if (/\b(snack|candy|chips|chocolate|popcorn|pretzels?|nuts|cookies?|jerky)\b/i.test(text)) {
    return 'Candy & Snacks';
  }
  if (/\b(soda|cola|juice|water|energy drink|tea|coffee|mixer|tonic|sparkling)\b/i.test(text)) {
    return 'Non-Alcoholic Drinks';
  }
  if (/\b(tobacco|vape|cigar|cigarette|nicotine|pouch|smoke)\b/i.test(text)) {
    return 'Tobacco & Vapes';
  }
  return 'General Retail';
}

/**
 * Determines whether a category name represents an empty or placeholder category.
 * @param {string} cat
 * @returns {boolean}
 */
export function isUncategorized(cat) {
  if (!cat || typeof cat !== 'string') return true;
  const c = cat.trim().toLowerCase();
  return (
    c === '' ||
    c === 'uncategorized' ||
    c === 'unknown' ||
    c === 'none' ||
    c === 'n/a' ||
    c === 'misc' ||
    c === 'general' ||
    c === 'no category' ||
    c === 'general inventory' ||
    c === 'other'
  );
}

/**
 * Computes frequency distribution and variety metrics from Clover inventory records or rows.
 * @param {Array<Object>} records - Clover records or review rows
 * @returns {Object} Comprehensive distribution summary
 */
export function computeCategoryDistribution(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      totalItems: 0,
      uniqueCategoryCount: 0,
      categorizedCount: 0,
      uncategorizedCount: 0,
      categorizedPercent: 0,
      topCategory: null,
      varietyRating: 'No Data',
      categories: []
    };
  }

  const categoryMap = new Map();
  let uncategorizedCount = 0;
  let categorizedCount = 0;

  for (const item of records) {
    const rawCat = typeof item.category === 'string' ? item.category.trim() : '';
    const itemName = typeof item.name === 'string' ? item.name : (item.current_name || item.original_name || 'Unnamed Item');

    if (isUncategorized(rawCat)) {
      uncategorizedCount++;
      const key = '(Uncategorized)';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: key,
          count: 0,
          sampleItems: [],
          rawItems: [],
          isUncategorized: true
        });
      }
      const entry = categoryMap.get(key);
      entry.count++;
      entry.rawItems.push(item);
      if (entry.sampleItems.length < 4 && itemName) {
        entry.sampleItems.push(itemName);
      }
    } else {
      categorizedCount++;
      // Handle comma-delimited multiple categories if present, or single category
      const categories = rawCat.includes(',') ? rawCat.split(',').map((s) => s.trim()).filter(Boolean) : [rawCat];
      for (const catName of categories) {
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, {
            name: catName,
            count: 0,
            sampleItems: [],
            rawItems: [],
            isUncategorized: false
          });
        }
        const entry = categoryMap.get(catName);
        entry.count++;
        entry.rawItems.push(item);
        if (entry.sampleItems.length < 4 && itemName) {
          entry.sampleItems.push(itemName);
        }
      }
    }
  }

  const totalItems = records.length;
  const categoriesList = [];

  for (const entry of categoryMap.values()) {
    const percentage = totalItems > 0 ? Number(((entry.count / totalItems) * 100).toFixed(1)) : 0;
    const toastDepartment = entry.isUncategorized
      ? 'Needs Classification'
      : inferToastDepartment(entry.name, entry.sampleItems);

    categoriesList.push({
      name: entry.name,
      count: entry.count,
      percentage,
      sampleItems: entry.sampleItems,
      rawItems: entry.rawItems,
      toastDepartment,
      isUncategorized: entry.isUncategorized
    });
  }

  // Sort by count descending by default
  categoriesList.sort((a, b) => {
    if (a.isUncategorized && !b.isUncategorized) return 1;
    if (!a.isUncategorized && b.isUncategorized) return -1;
    return b.count - a.count;
  });

  const validCategories = categoriesList.filter((c) => !c.isUncategorized);
  const uniqueCategoryCount = validCategories.length;
  const topCategory = categoriesList.length > 0 ? categoriesList[0] : null;

  // Compute Variety Rating
  let varietyRating = 'Balanced Variety';
  if (uniqueCategoryCount === 0) {
    varietyRating = 'No Categories';
  } else if (uniqueCategoryCount === 1) {
    varietyRating = 'Single Category';
  } else if (uniqueCategoryCount >= 8) {
    varietyRating = 'High Variety';
  } else if (uniqueCategoryCount >= 4) {
    varietyRating = 'Balanced Variety';
  } else {
    varietyRating = 'Low Variety';
  }

  const categorizedPercent = totalItems > 0 ? Number(((categorizedCount / totalItems) * 100).toFixed(1)) : 0;

  return {
    totalItems,
    uniqueCategoryCount,
    categorizedCount,
    uncategorizedCount,
    categorizedPercent,
    topCategory,
    varietyRating,
    categories: categoriesList
  };
}

/**
 * Sorts category distribution list according to criteria.
 * @param {Array<Object>} categories
 * @param {'count_desc' | 'alpha_asc' | 'count_asc'} sortBy
 * @returns {Array<Object>}
 */
export function sortDistribution(categories = [], sortBy = 'count_desc') {
  const list = [...categories];
  if (sortBy === 'alpha_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'count_asc') {
    list.sort((a, b) => a.count - b.count);
  } else {
    // count_desc
    list.sort((a, b) => {
      if (a.isUncategorized && !b.isUncategorized) return 1;
      if (!a.isUncategorized && b.isUncategorized) return -1;
      return b.count - a.count;
    });
  }
  return list;
}

/**
 * Filters category list by search query.
 * @param {Array<Object>} categories
 * @param {string} query
 * @returns {Array<Object>}
 */
export function filterDistribution(categories = [], query = '') {
  if (!query || typeof query !== 'string' || !query.trim()) return categories;
  const q = query.trim().toLowerCase();
  return categories.filter((c) => c.name.toLowerCase().includes(q) || c.toastDepartment.toLowerCase().includes(q));
}

/**
 * Generates an analytical insight summary of the category variety.
 * @param {Object} summary
 * @returns {string}
 */
export function generateCategoryInsight(summary) {
  if (!summary || summary.totalItems === 0) {
    return 'Load a Clover spreadsheet in Step 1 to analyze product category variety.';
  }

  const { totalItems, uniqueCategoryCount, topCategory, uncategorizedCount, varietyRating } = summary;

  if (uniqueCategoryCount === 0) {
    return `All ${totalItems} items currently lack specific categories. Autopilot will use semantic intelligence and brand patterns to categorize them into Toast departments.`;
  }

  let text = `Detected ${uniqueCategoryCount} distinct Clover categories across ${totalItems} products (${varietyRating}). `;

  if (topCategory && !topCategory.isUncategorized) {
    text += `Leading department is "${topCategory.name}" with ${topCategory.count} items (${topCategory.percentage}% of inventory). `;
  }

  if (uncategorizedCount > 0) {
    text += `⚠️ ${uncategorizedCount} items need classification. Autopilot will automatically map them.`;
  } else {
    text += `✓ 100% of imported items have categories ready for Toast normalization.`;
  }

  return text;
}

// Color palette for D3 charts matching the dark modern retail UI
export const CATEGORY_COLORS = [
  '#38bdf8', // sky-400
  '#818cf8', // indigo-400
  '#a78bfa', // purple-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#2dd4bf', // teal-400
  '#f97316', // orange-500
  '#60a5fa', // blue-400
  '#c084fc', // fuchsia-400
  '#4ade80', // green-400
  '#f87171'  // red-400
];

/**
 * Renders an interactive D3 category distribution chart.
 * @param {HTMLElement} container - DOM container element
 * @param {Object} distributionData - result from computeCategoryDistribution
 * @param {Object} config - chart configuration options
 */
export function renderD3CategoryChart(container, distributionData, config = {}) {
  if (!container) return;

  const d3 = (typeof window !== 'undefined' && window.d3) || config.d3;
  if (!d3) {
    container.innerHTML = '<div style="padding:20px;color:#94a3b8;text-align:center;">D3 chart library loading…</div>';
    return;
  }

  const view = config.view || 'bar';
  const sortBy = config.sortBy || 'count_desc';
  const searchQuery = config.searchQuery || '';
  const onCategoryClick = typeof config.onCategoryClick === 'function' ? config.onCategoryClick : null;
  const tooltipEl = config.tooltipEl || (typeof document !== 'undefined' ? document.getElementById('catD3Tooltip') : null);

  const categories = filterDistribution(sortDistribution(distributionData.categories, sortBy), searchQuery);

  // Clear previous SVG
  container.innerHTML = '';

  if (distributionData.totalItems === 0 || categories.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = 'padding:40px 20px;text-align:center;color:#94a3b8;';
    emptyDiv.innerHTML = `
      <div style="font-size:32px;margin-bottom:8px;">📦</div>
      <div style="font-weight:600;font-size:15px;color:#e2e8f0;margin-bottom:4px;">No Category Data to Display</div>
      <div style="font-size:13px;color:#64748b;">${distributionData.totalItems === 0 ? 'Upload a Clover file or load the sample 777 catalog in Step 1.' : 'No categories match your search filter.'}</div>
    `;
    container.appendChild(emptyDiv);
    return;
  }

  // Render Horizontal Bar Chart
  if (view === 'bar') {
    renderHorizontalBarChart(d3, container, categories, distributionData.totalItems, {
      onCategoryClick,
      tooltipEl
    });
  } else {
    // Render Donut Chart
    renderDonutChart(d3, container, categories, distributionData.totalItems, {
      onCategoryClick,
      tooltipEl
    });
  }
}

/**
 * Renders D3 Horizontal Bar Distribution Chart.
 */
function renderHorizontalBarChart(d3, container, categories, totalItems, options) {
  const { onCategoryClick, tooltipEl } = options;

  const rowHeight = 36;
  const margin = { top: 16, right: 90, bottom: 24, left: 160 };
  const containerWidth = Math.max(340, container.clientWidth || 680);
  const width = containerWidth;
  const innerWidth = width - margin.left - margin.right;
  const height = Math.max(160, categories.length * rowHeight + margin.top + margin.bottom);
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const maxCount = d3.max(categories, (d) => d.count) || 1;

  // Scales
  const xScale = d3.scaleLinear().domain([0, maxCount * 1.08]).range([0, innerWidth]);

  const yScale = d3
    .scaleBand()
    .domain(categories.map((d) => d.name))
    .range([0, innerHeight])
    .padding(0.25);

  const colorScale = d3
    .scaleOrdinal()
    .domain(categories.map((d) => d.name))
    .range(CATEGORY_COLORS);

  // Subtle vertical gridlines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(Math.min(5, maxCount))
        .tickSize(-innerHeight)
        .tickFormat('')
    )
    .selectAll('line')
    .style('stroke', '#1e293b')
    .style('stroke-dasharray', '3,3');

  // Bar group
  const barGroups = g
    .selectAll('.bar-group')
    .data(categories)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (d) => `translate(0, ${yScale(d.name)})`)
    .style('cursor', 'pointer');

  // Background track bars for depth
  barGroups
    .append('rect')
    .attr('class', 'bar-bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', innerWidth)
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('fill', '#1e293b')
    .attr('opacity', 0.6);

  // Active colored distribution bars
  barGroups
    .append('rect')
    .attr('class', 'bar-fill')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', (d) => Math.max(8, xScale(d.count)))
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('fill', (d, i) => (d.isUncategorized ? '#f59e0b' : colorScale(d.name)))
    .attr('opacity', 0.88)
    .style('transition', 'opacity 0.2s ease, filter 0.2s ease')
    .on('mouseenter', function () {
      d3.select(this).attr('opacity', 1).style('filter', 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))');
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 0.88).style('filter', 'none');
    });

  // Category Name Labels (Y-Axis)
  barGroups
    .append('text')
    .attr('x', -12)
    .attr('y', yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('fill', (d) => (d.isUncategorized ? '#fbbf24' : '#e2e8f0'))
    .attr('font-size', '12px')
    .attr('font-weight', '500')
    .text((d) => {
      const name = d.name;
      return name.length > 20 ? name.slice(0, 19) + '…' : name;
    })
    .append('title')
    .text((d) => d.name);

  // Value & Percentage Labels at the end of each bar
  barGroups
    .append('text')
    .attr('x', (d) => Math.max(8, xScale(d.count)) + 10)
    .attr('y', yScale.bandwidth() / 2 + 4)
    .attr('fill', '#cbd5e1')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .text((d) => `${d.count} (${d.percentage}%)`);

  // Interactive Hover Tooltips & Click Selection
  barGroups
    .on('mouseenter', (event, d) => {
      if (!tooltipEl) return;
      const sampleText = d.sampleItems && d.sampleItems.length > 0
        ? d.sampleItems.slice(0, 3).map((s) => `• ${s}`).join('<br>')
        : 'No product names';

      tooltipEl.innerHTML = `
        <div style="font-weight:700;font-size:13px;color:#f8fafc;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
          <span>${d.isUncategorized ? '⚠️' : '🏷️'}</span>
          <span>${d.name}</span>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">
          Items: <strong style="color:#38bdf8;">${d.count}</strong> of ${totalItems} (<strong style="color:#a78bfa;">${d.percentage}%</strong>)
        </div>
        <div style="font-size:11px;color:#34d399;margin-bottom:6px;background:rgba(52, 211, 153, 0.1);padding:3px 6px;border-radius:4px;">
          Toast Department: <strong>${d.toastDepartment}</strong>
        </div>
        <div style="font-size:11px;color:#94a3b8;border-top:1px solid #334155;padding-top:4px;">
          <div style="color:#64748b;margin-bottom:2px;">Sample Items:</div>
          ${sampleText}
        </div>
        <div style="font-size:10px;color:#38bdf8;margin-top:6px;text-align:right;">
          Click to inspect items ➔
        </div>
      `;
      tooltipEl.style.display = 'block';
      tooltipEl.style.opacity = '1';
    })
    .on('mousemove', (event) => {
      if (!tooltipEl) return;
      const x = event.pageX + 14;
      const y = event.pageY - 20;
      tooltipEl.style.left = `${x}px`;
      tooltipEl.style.top = `${y}px`;
    })
    .on('mouseleave', () => {
      if (!tooltipEl) return;
      tooltipEl.style.opacity = '0';
      tooltipEl.style.display = 'none';
    })
    .on('click', (event, d) => {
      if (onCategoryClick) {
        onCategoryClick(d);
      }
    });
}

/**
 * Renders D3 Donut Distribution Chart.
 */
function renderDonutChart(d3, container, categories, totalItems, options) {
  const { onCategoryClick, tooltipEl } = options;

  const width = Math.max(340, container.clientWidth || 680);
  const height = 300;
  const radius = Math.min(width, height) / 2 - 20;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');

  const chartCenter = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

  const colorScale = d3
    .scaleOrdinal()
    .domain(categories.map((d) => d.name))
    .range(CATEGORY_COLORS);

  const pie = d3
    .pie()
    .value((d) => d.count)
    .sort(null);

  const arc = d3
    .arc()
    .innerRadius(radius * 0.55)
    .outerRadius(radius * 0.95)
    .cornerRadius(4)
    .padAngle(0.02);

  const arcHover = d3
    .arc()
    .innerRadius(radius * 0.52)
    .outerRadius(radius * 1.0)
    .cornerRadius(4)
    .padAngle(0.02);

  const arcs = chartCenter
    .selectAll('.arc')
    .data(pie(categories))
    .enter()
    .append('g')
    .attr('class', 'arc')
    .style('cursor', 'pointer');

  // Slices
  arcs
    .append('path')
    .attr('d', arc)
    .attr('fill', (d) => (d.data.isUncategorized ? '#f59e0b' : colorScale(d.data.name)))
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 2)
    .attr('opacity', 0.9)
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', arcHover)
        .attr('opacity', 1)
        .style('filter', 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))');

      centerCategoryText.text(d.data.name.length > 18 ? d.data.name.slice(0, 16) + '…' : d.data.name);
      centerCountText.text(`${d.data.count} items (${d.data.percentage}%)`);

      if (!tooltipEl) return;
      const sampleText = d.data.sampleItems && d.data.sampleItems.length > 0
        ? d.data.sampleItems.slice(0, 3).map((s) => `• ${s}`).join('<br>')
        : 'No product names';

      tooltipEl.innerHTML = `
        <div style="font-weight:700;font-size:13px;color:#f8fafc;margin-bottom:4px;">
          🏷️ ${d.data.name}
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">
          Items: <strong style="color:#38bdf8;">${d.data.count}</strong> (<strong style="color:#a78bfa;">${d.data.percentage}%</strong>)
        </div>
        <div style="font-size:11px;color:#34d399;margin-bottom:4px;">
          Toast: <strong>${d.data.toastDepartment}</strong>
        </div>
        <div style="font-size:11px;color:#94a3b8;border-top:1px solid #334155;padding-top:4px;">
          ${sampleText}
        </div>
      `;
      tooltipEl.style.display = 'block';
      tooltipEl.style.opacity = '1';
    })
    .on('mousemove', (event) => {
      if (!tooltipEl) return;
      tooltipEl.style.left = `${event.pageX + 14}px`;
      tooltipEl.style.top = `${event.pageY - 20}px`;
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('d', arc).attr('opacity', 0.9).style('filter', 'none');

      centerCategoryText.text('Categories');
      centerCountText.text(`${totalItems} Total Items`);

      if (!tooltipEl) return;
      tooltipEl.style.opacity = '0';
      tooltipEl.style.display = 'none';
    })
    .on('click', (event, d) => {
      if (onCategoryClick) {
        onCategoryClick(d.data);
      }
    });

  // Center Donut Text
  const centerCategoryText = chartCenter
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -6)
    .attr('fill', '#f8fafc')
    .attr('font-size', '13px')
    .attr('font-weight', '700')
    .text('Categories');

  const centerCountText = chartCenter
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 14)
    .attr('fill', '#94a3b8')
    .attr('font-size', '11px')
    .text(`${totalItems} Total Items`);
}
