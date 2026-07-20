import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            'peer flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-black/25 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-coral/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-coral data-[state=checked]:bg-coral data-[state=checked]:text-white',
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
            <Check className="h-3 w-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
