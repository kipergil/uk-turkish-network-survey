import type { Question } from '@shared/types';

export interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  id: string;
}
