import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';

// منتقي تاريخ فردي — Shadcn نمط
function DatePicker({ value, onChange, placeholder = 'اختر التاريخ', className, disabled, min, max, ...props }) {
    const selected = value ? (value instanceof Date ? value : new Date(value)) : undefined;
    const label = selected ? format(selected, 'EEEE d MMMM yyyy', { locale: arSA }) : placeholder;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-11 w-full justify-start gap-2 rounded-input border border-black/10 bg-white px-3.5 text-start font-normal',
                        !selected && 'text-muted/70',
                        className,
                    )}
                >
                    <CalendarDays className="h-4 w-4 opacity-70" />
                    <span className="truncate">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(d) => onChange?.(d)}
                    initialFocus
                    disabled={(day) => {
                        if (min && day < new Date(min)) return true;
                        if (max && day > new Date(max)) return true;
                        return false;
                    }}
                    {...props}
                />
            </PopoverContent>
        </Popover>
    );
}

// منتقي مدى تواريخ (من - إلى)
function DateRangePicker({ value, onChange, placeholder = 'اختر مدى التواريخ', className, disabled, min, max, ...props }) {
    const range = value || { from: undefined, to: undefined };
    let label = placeholder;
    if (range.from && range.to) {
        label = `${format(range.from, 'd MMM', { locale: arSA })} → ${format(range.to, 'd MMM yyyy', { locale: arSA })}`;
    } else if (range.from) {
        label = `${format(range.from, 'd MMM yyyy', { locale: arSA })} → …`;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-11 w-full justify-start gap-2 rounded-input border border-black/10 bg-white px-3.5 text-start font-normal',
                        (!range.from || !range.to) && 'text-muted/70',
                        className,
                    )}
                >
                    <CalendarDays className="h-4 w-4 opacity-70" />
                    <span className="truncate">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => onChange?.(r)}
                    numberOfMonths={2}
                    initialFocus
                    disabled={(day) => {
                        if (min && day < new Date(min)) return true;
                        if (max && day > new Date(max)) return true;
                        return false;
                    }}
                    {...props}
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker, DateRangePicker };
