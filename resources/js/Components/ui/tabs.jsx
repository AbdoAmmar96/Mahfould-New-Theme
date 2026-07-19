import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// تبويبات محفول مكفول (Radix) — بستايل تبويبات الهيرو
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn('flex flex-wrap gap-1.5', className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            'inline-flex items-center gap-1.5 rounded-t-input px-4 py-2.5 text-sm font-semibold text-white/85 bg-white/10 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none data-[state=active]:bg-white data-[state=active]:text-navy',
            className,
        )}
        {...props}
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = TabsPrimitive.Content;

export { Tabs, TabsList, TabsTrigger, TabsContent };
