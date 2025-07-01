// ✅ Fibonacci Overlay Module

function drawFibonacciLevels(chart, high, low) {
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const fibLines = [];

  levels.forEach(level => {
    const price = low + (high - low) * level;
    fibLines.push({
      label: `Fib ${level}`,
      data: Array(chart.data.labels.length).fill(price),
      borderColor: 'rgba(0, 191, 255, 0.5)',
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false,
      tension: 0.1,
      borderWidth: 1.2
    });
  });

  // Clear old fib lines
  chart.data.datasets = chart.data.datasets.filter(ds => !ds.label?.startsWith("Fib"));

  // Add new fib lines
  chart.data.datasets.push(...fibLines);
  chart.update();
}
