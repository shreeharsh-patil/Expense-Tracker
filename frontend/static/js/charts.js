/**
 * Spendly — Chart rendering module
 * Extracted from inline scripts in dashboard.html and reports.html for better caching
 * and performance. Reads data from window.chartData and window.reportData.
 */

// ============ Dashboard Charts ============

function renderDashboardCharts() {
  const canvas = document.getElementById('incomeTrendChart');
  if (!canvas) return; // Not on dashboard page

  const ctxTrend = canvas.getContext('2d');
  const methodCanvas = document.getElementById('methodChart');
  if (!methodCanvas) return;
  const ctxMethod = methodCanvas.getContext('2d');
  const data = window.chartData;
  if (!data || !data.trendLabels) return;

  const colors = window.getChartThemeColors();
  if (window.trendChart) window.trendChart.destroy();
  if (window.methodChart) window.methodChart.destroy();

  // Guard: skip rendering if there's no data (empty dashboard)
  var hasTrendData = data.trendLabels && data.trendLabels.length > 0;
  var hasMethodData = data.methodsLabels && data.methodsLabels.length > 0;
  if (!hasTrendData && !hasMethodData) {
    if (typeof showChartSkeleton === 'function') showChartSkeleton(false);
    return;
  }

  // Combined Income + Expense Trend (Bar overlay)
  window.trendChart = new Chart(ctxTrend, {
    type: 'bar',
    data: {
      labels: data.trendLabels,
      datasets: [
        {
          label: 'Income',
          data: data.incomeTrendValues,
          backgroundColor: window.hexToRgba(colors.incomeColor, 0.7),
          borderRadius: 4,
          maxBarThickness: 16
        },
        {
          label: 'Spending',
          data: data.trendValues,
          backgroundColor: window.hexToRgba(colors.spendingColor, 0.8),
          borderRadius: 4,
          maxBarThickness: 16
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 10, padding: 8, font: { size: 9, family: 'Inter' }, color: colors.tickColor }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 10,
          callbacks: { label: function(ctx) { return ' ' + ctx.dataset.label + ': ' + data.currencySymbol + ctx.raw; } }
        }
      },
      scales: {
        y: { display: false, min: 0, beginAtZero: true },
        x: { grid: { display: false }, ticks: { color: colors.tickColor, font: { size: 10 } } }
      }
    }
  });

  // Payment Methods Chart (Bar)
  window.methodChart = new Chart(ctxMethod, {
    type: 'bar',
    data: {
      labels: data.methodsLabels,
      datasets: [{
        label: 'Amount',
        data: data.methodsValues,
        backgroundColor: colors.palette,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          padding: 10,
          callbacks: { label: function(ctx) { return ' ' + data.currencySymbol + ctx.raw; } }
        }
      },
      scales: {
        x: { display: false, min: 0, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: colors.tickColor, font: { size: 10, family: 'Inter', weight: 'bold' } } }
      }
    }
  });
}

// ============ Reports Charts ============

function renderReportCharts() {
  const canvas = document.getElementById('annualChart');
  if (!canvas) return; // Not on reports page

  const ctxAnnual = canvas.getContext('2d');
  const ctxCategory = document.getElementById('categoryChart').getContext('2d');
  const data = window.reportData;
  if (!data) return;

  const colors = window.getChartThemeColors();
  if (window.annualChart) window.annualChart.destroy();
  if (window.categoryChart) window.categoryChart.destroy();

  // Annual Chart (Income vs Spending grouped bars)
  window.annualChart = new Chart(ctxAnnual, {
    type: 'bar',
    data: {
      labels: data.monthNames,
      datasets: [
        {
          label: 'Income',
          data: data.incomeMonthlyValues,
          backgroundColor: window.hexToRgba(colors.incomeColor, 0.7),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 30
        },
        {
          label: 'Spending',
          data: data.monthlyTotals,
          backgroundColor: window.hexToRgba(colors.primaryColor, 0.8),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 30
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 10, padding: 10, font: { size: 9, family: 'Inter' }, color: colors.tickColor }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        }
      },
      scales: {
        y: {
          grid: { color: colors.gridColor, drawBorder: false },
          ticks: { color: colors.tickColor, font: { size: 10, family: 'Fragment Mono' }, callback: function(value) { return data.currencySymbol + value; } }
        },
        x: {
          grid: { display: false },
          ticks: { color: colors.tickColor, font: { size: 10, family: 'Inter', weight: 'bold' } }
        }
      }
    }
  });

  // Category Doughnut Chart
  window.categoryChart = new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: colors.palette,
        borderWidth: 2,
        borderColor: colors.cardColor,
        borderRadius: 4,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          titleFont: { size: 11, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        }
      }
    }
  });
}

// ============ Lazy Loading — Load Chart.js via IntersectionObserver ============

let _chartJsLoading = false;
let _chartJsLoaded = false;

function loadChartJsLazy() {
  // Already loaded or already loading — skip
  if (_chartJsLoaded || _chartJsLoading) return;

  // Check if any chart canvas exists on this page
  var canvases = document.querySelectorAll('canvas[id$="Chart"], canvas[id$="TrendChart"]');
  if (canvases.length === 0) return; // Not on a chart page

  _chartJsLoading = true;

  var observer = new IntersectionObserver(function(entries) {
    var shouldLoad = entries.some(function(entry) { return entry.isIntersecting; });
    if (shouldLoad) {
      observer.disconnect();
      _injectChartJs();
    }
  }, { rootMargin: '150px' }); // Start loading 150px before charts enter the viewport

  canvases.forEach(function(canvas) { observer.observe(canvas); });

  // Safety net: if IntersectionObserver isn't supported, load after a timeout
  if (typeof IntersectionObserver === 'undefined') {
    setTimeout(_injectChartJs, 2000);
  }
}

function _injectChartJs() {
  if (_chartJsLoaded) return;

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = function() {
    _chartJsLoaded = true;
    _chartJsLoading = false;

    // Apply Chart defaults
    Chart.defaults.font.family = "'Fragment Mono', monospace";
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '#475569';

    // Brief delay so skeleton is visible, then render
    setTimeout(function() {
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      if (typeof renderReportCharts === 'function') renderReportCharts();
      if (typeof showChartSkeleton === 'function') showChartSkeleton(false);
    }, 250);
  };
  script.onerror = function() {
    _chartJsLoading = false;
    if (typeof showChartSkeleton === 'function') showChartSkeleton(false);
  };
  document.head.appendChild(script);
}

// Re-render charts on theme change (runs on whichever page has charts)
window.addEventListener('theme-changed', function() {
  if (typeof Chart === 'undefined') return;
  if (document.getElementById('incomeTrendChart')) {
    renderDashboardCharts();
  }
  if (document.getElementById('annualChart')) {
    renderReportCharts();
  }
});
