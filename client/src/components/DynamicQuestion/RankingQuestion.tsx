import * as React from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { localize } from '@shared/types';
import type { QuestionInputProps } from './types';

function SortableRow({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm',
        isDragging && 'opacity-70 shadow-lg',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
        {index + 1}
      </span>
      <span className="flex-1">{label}</span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </li>
  );
}

export function RankingQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang, t } = useI18n();
  const options = question.options ?? [];
  const order = (value as string[] | undefined) ?? options.map((o) => o.value);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    onChange(arrayMove(order, oldIndex, newIndex));
  };

  const labelFor = (val: string) => {
    const opt = options.find((o) => o.value === val);
    return opt ? localize(opt, 'label', lang) : val;
  };

  return (
    <div id={id}>
      <p className="mb-2 text-xs text-muted-foreground">{t('common.dragToReorder')}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="flex max-w-md flex-col gap-2">
            {order.map((val, i) => (
              <SortableRow key={val} id={val} label={labelFor(val)} index={i} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
