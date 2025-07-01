export function drawSupportResistance(chart) {
  const candles = chart.data.datasets[0].data;
  const labels = chart.data.labels;
  if (candles.length < 30) return;

  // Simple: find common highs/lows in the last 50 bars
  const slice = candles.slice(-50);
  const supports = [];
  const resistances = [];

  for (let i = 2; i < slice.length - 2; i++) {
    const prev = slice[i - 1], cur = slice[i], next = slice[i + 1];
    
    // Local low (support)
    if (cur < prev && cur < next) {
      supports.push(cur);
    }

    // Local high (resistance)
    if (cur > prev && cur > next) {
      resistances.push(cur);
    }
  }

  // Average out clusters to get clean zones
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const uniqueZones = (arr, threshold = 0.5) => {
    arr.sort((a, b) => a - b);
    const zones = [];
    let group = [arr[0]];

    for (let i = 1; i < arr.length; i++) {
      if (Math.abs(arr[i] - group[group.length - 1]) <= threshold) {
        group.push(arr[i]);
      } else {
        zones.push(avg(group));
        group = [arr[i]];
      }
    }
    zones.push(avg(group));
    return zones;
  };

  const supportLevels = uniqueZones(supports);
  const resistanceLevels = uniqueZones(resistances);

  // Remove old SR lines
  chart.data.datasets = chart.data.datasets.filter(ds => !ds.label?.startsWith("Support") && !ds.label?.startsWith("Resistance"));

  // Draw support lines
  supportLevels.forEach((lvl, i) => {
    chart.data.datasets.push({
      label: `Support ${i + 1}`,
      data: Array(labels.length).fill(lvl),
      borderColor: 'blue',
      borderDash: [3, 3],
      pointRadius: 0,
      fill: false,
      tension: 0.1,
      borderWidth: 1
    });
  });

  resistanceLevels.forEach((lvl, i) => {
    chart.data.datasets.push({
      label: `Resistance ${i + 1}`,
      data: Array(labels.length).fill(lvl),
      borderColor: 'deepskyblue',
      borderDash: [3, 3],
      pointRadius: 0,
      fill: false,
      tension: 0.1,
      borderWidth: 1
    });
  });

  chart.update();
}
