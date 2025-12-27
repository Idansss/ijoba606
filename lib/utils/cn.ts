import { twMerge } from 'tailwind-merge';

export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined | ClassValue };

function toClassList(value: ClassValue): string[] {
  if (value === null || value === undefined || value === false) {
    return [];
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value).trim();
    return str ? [str] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(toClassList);
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, active]) =>
      active ? toClassList(key) : []
    );
  }

  return [];
}

export function cn(...inputs: ClassValue[]): string {
  const classes = inputs.flatMap(toClassList);
  return twMerge(classes.join(' '));
}

