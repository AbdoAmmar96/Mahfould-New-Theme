import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// دمج كلاسات Tailwind بأمان (Shadcn helper)
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
