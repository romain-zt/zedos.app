import { ArrowUpRight, Mail } from 'lucide-react';
import { FaqList } from './faq-list';
import {
  MarketingContainer,
  SectionIntro,
  ZedosLogo,
} from './landing-primitives';
import { TrackedLink } from './landing-analytics';

export function FaqSection() {
  return (
    <section
      className="bg-studio-canvas py-20 sm:py-28 lg:py-32"
      aria-labelledby="faq-title"
    >
      <MarketingContainer>
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <SectionIntro
            eyebrow="Questions, answered plainly"
            title="Know what you are joining."
            titleId="faq-title"
            body="Zedos is early. These answers separate the product direction from what each pilot can use today."
          />
          <FaqList />
        </div>
      </MarketingContainer>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-studio-ink py-12 text-white">
      <MarketingContainer>
        <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div>
            <ZedosLogo inverse />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              A flexible digital foundation for reservation-led wellness businesses.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <p className="text-xs font-semibold uppercase tracking-widest text-studio-sage">
              Explore
            </p>
            <ul className="mt-4 space-y-1">
              {[
                ['#how-it-works', 'How it works'],
                ['#why-zedos', 'Why Zedos'],
                ['#early-access', 'Early access'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="inline-flex min-h-11 items-center text-sm text-white/60 hover:text-white focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-sage"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal and contact">
            <p className="text-xs font-semibold uppercase tracking-widest text-studio-sage">
              Details
            </p>
            <ul className="mt-4 space-y-1">
              <li>
                <a
                  href="/legal/privacy"
                  className="inline-flex min-h-11 items-center px-1 text-sm text-white/60 hover:text-white focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-sage"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/legal/terms"
                  className="inline-flex min-h-11 items-center px-1 text-sm text-white/60 hover:text-white focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-sage"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@zedos.app"
                  className="inline-flex min-h-11 items-center gap-2 px-1 text-sm text-white/60 hover:text-white focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-sage"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Zedos. Private pilot · Paris, France.</p>
          <TrackedLink
            href="/sign-in"
            placement="footer_sign_in"
            className="inline-flex min-h-11 w-fit items-center gap-2 text-white/60 hover:text-white focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-sage"
          >
            Existing pilot? Sign in
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>
      </MarketingContainer>
    </footer>
  );
}
