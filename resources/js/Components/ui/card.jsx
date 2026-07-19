import * as React from 'react';
import { cn } from '@/lib/utils';

// بطاقة محفول مكفول — Shadcn-style
const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'group flex flex-col overflow-hidden rounded-card border border-black/[.06] bg-white shadow-mk transition-all duration-300 hover:-translate-y-1 hover:shadow-mk-lg',
            className,
        )}
        {...props}
    />
));
Card.displayName = 'Card';

const CardMedia = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative aspect-[4/3] overflow-hidden bg-beige', className)} {...props} />
));
CardMedia.displayName = 'CardMedia';

const CardBody = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col p-4 pt-4', className)} {...props} />
));
CardBody.displayName = 'CardBody';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-head text-lg font-semibold leading-snug text-navy', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardMeta = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-[13px] font-semibold text-muted', className)} {...props} />
));
CardMeta.displayName = 'CardMeta';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-auto flex items-center justify-between pt-3.5', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter };
