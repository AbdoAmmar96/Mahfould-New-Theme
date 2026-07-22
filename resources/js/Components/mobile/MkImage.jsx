// محفول مكفول — صورة بسلوك أبليكشن:
// هيكل عظمي (skeleton) وهي بتحمّل → ظهور تدريجي، ولو فشلت تحميل → بديل محلي.
// الهدف: مفيش مربع فاضي ولا «قفزة» في التخطيط أبداً.
import { useState } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK = '/assets/img/placeholder.svg';

export default function MkImage({
    src,
    alt = '',
    className,
    wrapperClassName,
    ratio = 'aspect-[4/3]',
    priority = false,
    ...rest
}) {
    const [state, setState] = useState('loading'); // loading | ready | failed

    return (
        <div className={cn('relative overflow-hidden bg-beige', ratio, wrapperClassName)}>
            {/* الهيكل العظمي — بيختفي أول ما الصورة تجهز */}
            {state === 'loading' && (
                <div className="mk-shimmer absolute inset-0" aria-hidden="true" />
            )}

            <img
                src={state === 'failed' ? FALLBACK : src || FALLBACK}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                // fetchpriority بيخلّي أول صورة في الشاشة تسبق باقي الطلبات
                fetchPriority={priority ? 'high' : 'auto'}
                decoding="async"
                onLoad={() => setState('ready')}
                onError={() => setState('failed')}
                className={cn(
                    'h-full w-full object-cover transition-opacity duration-500',
                    state === 'ready' ? 'opacity-100' : 'opacity-0',
                    state === 'failed' && 'opacity-100 object-contain p-6',
                    className,
                )}
                {...rest}
            />
        </div>
    );
}
