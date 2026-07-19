import * as React from 'react';
import { cn } from '@/lib/utils';

// حقل إدخال محفول مكفول
const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
    <input
        ref={ref}
        type={type}
        className={cn(
            'h-11 w-full rounded-input border border-black/10 bg-white px-3.5 text-sm text-navy outline-none transition-colors placeholder:text-muted/70 focus:border-coral focus:ring-2 focus:ring-coral/20 disabled:opacity-50',
            className,
        )}
        {...props}
    />
));
Input.displayName = 'Input';

// قائمة اختيار (native — منسّقة بنفس هوية الحقل)
const Select = React.forwardRef(({ className, children, ...props }, ref) => (
    <select
        ref={ref}
        className={cn(
            'mk-native-select h-11 w-full rounded-input border border-black/10 bg-white ps-3.5 pe-9 text-sm text-navy outline-none transition-colors focus:border-coral focus:ring-2 focus:ring-coral/20 disabled:opacity-50',
            className,
        )}
        {...props}
    >
        {children}
    </select>
));
Select.displayName = 'Select';

// حقل بعنوان (label فوق control)
function Field({ label, children, className }) {
    return (
        <label className={cn('flex flex-col gap-1.5', className)}>
            <span className="text-xs font-semibold text-muted">{label}</span>
            {children}
        </label>
    );
}

export { Input, Select, Field };
