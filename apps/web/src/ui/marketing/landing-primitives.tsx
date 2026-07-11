import Link from 'next/link';
import { classNames } from './class-names';

export function MarketingContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export function ZedosLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={classNames(
        'inline-flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay focus-visible:ring-offset-4',
        inverse && 'focus-visible:ring-offset-studio-ink'
      )}
      aria-label="Zedos home"
    >
      <span
        aria-hidden="true"
        className={classNames(
          'grid h-8 w-8 place-items-center rounded-full border font-display text-sm font-bold',
          inverse
            ? 'border-white/30 bg-white text-studio-ink'
            : 'border-studio-ink/20 bg-studio-ink text-studio-canvas'
        )}
      >
        Z
      </span>
      <span
        className={classNames(
          'font-display text-xl font-semibold tracking-tight',
          inverse ? 'text-white' : 'text-studio-ink'
        )}
      >
        zedos
        <span className={inverse ? 'text-studio-sage' : 'text-studio-clay'}>.</span>
      </span>
    </Link>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  body,
  align = 'left',
  inverse = false,
  className,
  titleId,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  inverse?: boolean;
  className?: string;
  titleId?: string;
}) {
  return (
    <header
      className={classNames(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      <p
        className={classNames(
          'mb-4 text-xs font-semibold uppercase tracking-[0.18em]',
          inverse ? 'text-studio-sage' : 'text-studio-forest'
        )}
      >
        {eyebrow}
      </p>
      <h2
        id={titleId}
        className={classNames(
          'text-balance font-editorial text-4xl font-medium leading-none tracking-tight sm:text-5xl lg:text-6xl',
          inverse ? 'text-white' : 'text-studio-ink'
        )}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={classNames(
            'mt-5 max-w-2xl text-base leading-7 sm:text-lg',
            align === 'center' && 'mx-auto',
            inverse ? 'text-white/70' : 'text-studio-muted'
          )}
        >
          {body}
        </p>
      ) : null}
    </header>
  );
}
