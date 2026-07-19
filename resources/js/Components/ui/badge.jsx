import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// شارة محفول مكفول
const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold leading-none',
    {
        variants: {
            variant: {
                makfol: 'bg-makfol text-white',
                vip: 'bg-vip text-white',
                best: 'bg-gradient-to-br from-coral to-coral-deep text-white',
                royal: 'bg-royal text-white',
                soft: 'bg-beige text-navy',
            },
        },
        defaultVariants: { variant: 'soft' },
    },
);

function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
