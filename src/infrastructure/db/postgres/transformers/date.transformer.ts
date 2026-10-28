import { ValueTransformer } from 'typeorm';

// Maps a Postgres `date` ('YYYY-MM-DD') to a Date at UTC midnight and back.
export const dateTransformer: ValueTransformer = {
  from: (value: string | null) => (value ? new Date(value) : null),
  to: (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : value),
};
