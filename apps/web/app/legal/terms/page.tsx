'use client';

import { useI18n } from '@/src/i18n';

export default function TermsPage() {
  const { tp } = useI18n();
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {tp('title', 'Terms of Use')}
      </h1>

      <p className="text-muted-foreground">
        {tp('intro', 'These Terms of Use govern access to and use of the Zedos service (the “Service”). By accessing or using the Service, you agree to these Terms.')}
      </p>

      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {tp('lastUpdatedLabel', 'Last updated:')} <strong>{tp('lastUpdatedDate', 'May 27, 2026')}</strong>
        </p>

        <p className="text-muted-foreground">
          {tp('note', 'Note: this document is provided for general information and does not constitute legal advice.')}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s1Title', '1. Service Provider and Contact')}</h2>
        <p className="text-muted-foreground">
          {tp('s1P1Prefix', 'The Service provider (“we”, “us”, “our”) is:')} <strong>{tp('company', 'ZedTech')}</strong>.
        </p>
        <p className="text-muted-foreground">
          {tp('s1AddressLabel', 'Address:')} <strong>{tp('address', '75000 Paris')}</strong>.
        </p>
        <p>
          {tp('s1ContactLabel', 'Contact:')}{' '}
          <a className="underline" href="mailto:support@zedos.app">
            {tp('supportEmail', 'support@zedos.app')}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s2Title', '2. Access to the Service')}</h2>
        <p className="text-muted-foreground">
          {tp('s2P1', 'Access to certain features may require account registration.')}
        </p>
        <p className="text-muted-foreground">
          {tp('s2P2', 'We may modify, suspend, or discontinue any part of the Service for maintenance, technical, security, or legal reasons.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s3Title', '3. User Account')}</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{tp('s3L1', 'You are responsible for providing accurate registration information.')}</li>
          <li>
            {tp('s3L2', 'You must keep your credentials secure and notify us promptly of unauthorized access.')}
          </li>
          <li>{tp('s3L3', 'We may suspend accounts used in breach of these Terms.')}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s4Title', '4. Acceptable Use')}</h2>
        <p className="text-muted-foreground">
          {tp('s4P1', 'You agree to use the Service in compliance with applicable laws and these Terms.')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{tp('s4L1', 'You must not bypass or attempt to bypass security controls.')}</li>
          <li>
            {tp('s4L2', 'You must not use the Service for unlawful, fraudulent, or harmful activities.')}
          </li>
          <li>{tp('s4L3', 'You must not upload or share content that is clearly illegal.')}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s5Title', '5. User Content')}</h2>
        <p className="text-muted-foreground">
          {tp('s5P1', 'You retain rights to your content. You grant us a limited license to process your content as necessary to provide and improve the Service.')}
        </p>
        <p className="text-muted-foreground">
          {tp('s5P2', 'You represent that you have all rights required to submit the content you provide.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s6Title', '6. AI Features (GDPR / AI Act)')}</h2>
        <p className="text-muted-foreground">
          {tp('s6Intro', 'Some Service features rely on AI systems. These systems may process information you provide (for example prompts and documents) to generate responses, summaries, or assistance.')}
        </p>

        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>{tp('s6L1Title', 'Transparency:')}</strong> {tp('s6L1Body', 'AI outputs may be inaccurate or incomplete and must be reviewed before use.')}
          </li>
          <li>
            <strong>{tp('s6L2Title', 'Human oversight:')}</strong> {tp('s6L2Body', 'The Service assists users and does not replace human judgment.')}
          </li>
          <li>
            <strong>{tp('s6L3Title', 'AI Act compliance:')}</strong> {tp('s6L3Body', 'We implement reasonable measures to meet applicable transparency and usage obligations.')}
          </li>
        </ul>

        <p className="text-muted-foreground">
          {tp('s6FooterPrefix', 'Personal data processing related to AI features is further described in our')}
          <a className="underline" href="/legal/privacy">
            {' '}{tp('privacyPolicyLink', 'Privacy Policy')}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s7Title', '7. Payments (if applicable)')}</h2>
        <p className="text-muted-foreground">
          {tp('s7Body', 'If you purchase subscriptions or credits, payments may be processed by third-party payment providers (for example Stripe), in accordance with applicable laws.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s8Title', '8. Intellectual Property')}</h2>
        <p className="text-muted-foreground">
          {tp('s8Body', 'The Service, including its software, interface, branding, and content, is protected by intellectual property laws. You may not copy, modify, distribute, or commercially exploit it without prior authorization.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s9Title', '9. Liability')}</h2>
        <p className="text-muted-foreground">
          {tp('s9P1', 'To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the Service.')}
        </p>
        <p className="text-muted-foreground">
          {tp('s9P2', 'Decisions made based on AI outputs remain your responsibility.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s10Title', '10. Suspension and Termination')}</h2>
        <p className="text-muted-foreground">
          {tp('s10Body', 'We may suspend or terminate your access in case of serious breach of these Terms, security risks, or legal requirements.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s11Title', '11. Governing Law')}</h2>
        <p className="text-muted-foreground">
          {tp('s11Body', 'These Terms are governed by French law, subject to mandatory legal provisions.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s12Title', '12. Changes to These Terms')}</h2>
        <p className="text-muted-foreground">
          {tp('s12Body', 'We may update these Terms from time to time. The latest version date appears at the top of this page. Material changes may be notified to users.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s13Title', '13. Privacy Contact')}</h2>
        <p className="text-muted-foreground">
          {tp('s13BodyPrefix', 'For questions related to personal data processing, please refer to our')}{' '}
          <a className="underline" href="/legal/privacy">{tp('privacyPolicyLink', 'Privacy Policy')}</a>.
        </p>
      </section>
    </main>
  );
}
