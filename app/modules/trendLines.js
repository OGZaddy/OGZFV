export function drawTrendLine(chart, direction = 'up') {
  const len = chart.data.labels.length;
  if (len < 20) return;

  let x1, x2, y1, y2;

  if (direction === 'up') {
    y1 = Math.min(...chart.data.datasets[0].data.slice(len - 20, len - 10));
    y2 = Math.min(...chart.data.datasets[0].data.slice(len - 10));
  } else {
    y1 = Math.max(...chart.data.datasets[0].data.slice(len - 20, len - 10));
    y2 = Math.max(...chart.data.datasets[0].data.slice(len - 10));
  }

  x1 = len - 20;
  x2 = len;

  const trendData = Array(len).fill(null);
  for (let i = x1; i <= x2; i++) {
    const slope = (y2 - y1) / (x2 - x1);
    trendData[i] = y1 + slope * (i - x1);
  }

  chart.data.datasets.push({
    label: 'Trend Line',
    data: trendData,
    borderColor: direction === 'up' ? 'lime' : 'red',
    borderDash: [5, 5],
    pointRadius: 0,
    borderWidth: 2,
    fill: false,
    tension: 0.1
  });

  chart.update();
}
