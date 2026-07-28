import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function MatrixResultChart({ rowAverages }: { rowAverages: Array<{ row: string; average: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rowAverages.length * 40)}>
      <BarChart data={rowAverages} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} />
        <YAxis type="category" dataKey="row" width={140} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="average" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
