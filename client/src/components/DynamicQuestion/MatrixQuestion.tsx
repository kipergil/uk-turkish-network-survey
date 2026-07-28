import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { MatrixConfig } from '@shared/types';
import type { QuestionInputProps } from './types';

export function MatrixQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang } = useI18n();
  const cfg = question.config as MatrixConfig | null;
  const rows = (lang === 'en' ? cfg?.rows_en : cfg?.rows_tr) ?? [];
  const columns = cfg?.columns ?? [1, 2, 3, 4, 5];
  const current = (value as Record<string, number> | undefined) ?? {};

  const setCell = (rowIndex: number, col: number) => {
    onChange({ ...current, [String(rowIndex)]: col });
  };

  return (
    <div id={id} className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left font-normal text-muted-foreground" />
            {columns.map((c) => (
              <th key={c} className="p-2 text-center font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row} className="border-t">
              <th scope="row" className="p-2 text-left font-normal">
                {row}
              </th>
              {columns.map((c) => {
                const cellId = `${id}-${rowIndex}-${c}`;
                const checked = current[String(rowIndex)] === c;
                return (
                  <td key={c} className="p-2 text-center">
                    <button
                      type="button"
                      id={cellId}
                      role="radio"
                      aria-checked={checked}
                      aria-label={`${row}: ${c}`}
                      onClick={() => setCell(rowIndex, c)}
                      className={cn(
                        'mx-auto flex h-6 w-6 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        checked ? 'border-primary bg-primary' : 'border-input hover:bg-accent',
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
