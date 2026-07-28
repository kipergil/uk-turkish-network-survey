import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function NumericChart({ average, histogram }: { average: number; histogram: Record<string, number> }) {
  const data = Object.entries(histogram)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([bucket, count]) => ({ name: bucket, value: count }));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xl font-semibold">
        {average.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ ortalama</span>
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
