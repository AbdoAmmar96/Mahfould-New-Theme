import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// زر محفول مكفول — Shadcn-style بهوية اللوجو
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input font-head font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
    {
        variants: {
            variant: {
                primary: 'bg-gradient-to-br from-coral to-coral-deep text-white shadow-[0_10px_26px_rgba(234,75,59,.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(234,75,59,.36)]',
                secondary: 'bg-transparent text-navy border border-navy/20 hover:bg-beige hover:border-navy',
                ghost: 'bg-white/10 text-white border border-white/30 hover:bg-white/20',
                outline: 'bg-white text-navy border border-black/10 hover:bg-cream',
                light: 'bg-white text-coral-deep hover:bg-cream shadow-mk',
            },
            size: {
                default: 'px-5 py-3 text-sm',
                lg: 'px-8 py-4 text-base',
                sm: 'px-3.5 py-2 text-[13px]',
                icon: 'h-10 w-10',
            },
            block: { true: 'w-full' },
        },
        defaultVariants: { variant: 'primary', size: 'default' },
    },
);

const Button = React.forwardRef(({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, block, className }))} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
