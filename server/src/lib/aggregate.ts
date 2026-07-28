export function aggregateDistribution(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
}

export function aggregateMultiChoice(values: string[][]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const arr of values) for (const v of arr ?? []) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
}

export function aggregateBoolean(values: string[]): { true: number; false: number } {
  let t = 0;
  let f = 0;
  for (const v of values) {
    if (v === 'true') t += 1;
    else if (v === 'false') f += 1;
  }
  return { true: t, false: f };
}

export function aggregateNumeric(values: number[]): { average: number; histogram: Record<string, number> } {
  const histogram: Record<string, number> = {};
  let sum = 0;
  for (const v of values) {
    histogram[String(v)] = (histogram[String(v)] ?? 0) + 1;
    sum += v;
  }
  return { average: values.length ? sum / values.length : 0, histogram };
}

export function aggregateMatrix(
  values: Array<Record<string, number>>,
  rowLabels: string[],
): Array<{ row: string; average: number }> {
  return rowLabels.map((label, i) => {
    const key = String(i);
    const nums = values.map((v) => v?.[key]).filter((n): n is number => typeof n === 'number');
    const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    return { row: label, average };
  });
}

export function aggregateRanking(values: string[][], optionValues: string[]): Array<{ value: string; score: number }> {
  const n = optionValues.length;
  const scores: Record<string, number> = Object.fromEntries(optionValues.map((v) => [v, 0]));
  for (const order of values) {
    order.forEach((val, idx) => {
      const weight = n - idx;
      if (val in scores) scores[val] += weight;
    });
  }
  return optionValues.map((v) => ({ value: v, score: scores[v] })).sort((a, b) => b.score - a.score);
}
