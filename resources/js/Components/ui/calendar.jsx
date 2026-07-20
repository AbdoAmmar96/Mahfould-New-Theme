import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/Components/ui/button';

// تقويم Shadcn (react-day-picker) — RTL بالعربي
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
    return (
        <DayPicker
            dir="rtl"
            locale={arSA}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col gap-3 sm:flex-row',
                month: 'space-y-3',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-bold text-navy font-head',
                nav: 'flex items-center gap-1',
                nav_button: cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
                ),
                nav_button_previous: 'absolute end-1',
                nav_button_next: 'absolute start-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-muted rounded-md w-8 font-semibold text-[.75rem]',
                row: 'flex w-full mt-1.5',
                cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-beige [&:has([aria-selected].day-outside)]:bg-beige/40 [&:has([aria-selected].day-range-end)]:rounded-e-md [&:has([aria-selected].day-range-start)]:rounded-s-md first:[&:has([aria-selected])]:rounded-e-md last:[&:has([aria-selected])]:rounded-s-md',
                day: cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    'h-8 w-8 p-0 font-semibold aria-selected:opacity-100 border-transparent bg-transparent hover:bg-beige',
                ),
                day_range_start: 'day-range-start !bg-coral !text-white rounded-s-md',
                day_range_end: 'day-range-end !bg-coral !text-white rounded-e-md',
                day_selected: '!bg-coral !text-white hover:!bg-coral-deep',
                day_today: 'ring-1 ring-coral/40',
                day_outside: 'day-outside text-muted/50',
                day_disabled: 'text-muted/40',
                day_range_middle: 'aria-selected:bg-beige aria-selected:text-navy',
                day_hidden: 'invisible',
                ...classNames,
            }}
            components={{
                IconLeft: (props) => <ChevronLeft className="h-4 w-4" {...props} />,
                IconRight: (props) => <ChevronRight className="h-4 w-4" {...props} />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

export { Calendar };
