import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';

type MinimalOption = { value: string; label_tr: string; label_en: string };

export function DistributionChart({
  counts,
  options,
}: {
  counts: Record<string, number>;
  options?: MinimalOption[];
}) {
  const { lang } = useI18n();
  const labelFor = (value: string) => {
    const opt = options?.find((o) => o.value === value);
    return opt ? localize(opt, 'label', lang) : value;
  };

  const data = Object.entries(counts).map(([value, count]) => ({ name: labelFor(value), value: count }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
