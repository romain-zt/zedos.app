'use client';

import { useI18n } from '@/src/i18n';

export default function PrivacyPage() {
  const { tp } = useI18n();
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {tp('title', 'Privacy Policy (GDPR)')}
      </h1>

      <p className="text-muted-foreground">
        {tp(
          'intro',
          'This policy explains how Zedos collects and processes personal data when you use our Service, including AI-powered features.'
        )}
      </p>

      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {tp('lastUpdatedLabel', 'Last updated:')} <strong>{tp('lastUpdatedDate', 'May 27, 2026')}</strong>
        </p>

        <p className="text-muted-foreground">
          {tp(
            'note',
            'Note: this document is provided for general information and may require legal validation depending on your operational setup.'
          )}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s1Title', '1. Data Controller and Contact')}</h2>
        <p className="text-muted-foreground">
          {tp('s1P1Prefix', 'The data controller (“we”, “us”, “our”) is')} <strong>{tp('company', 'ZedTech')}</strong>.
        </p>
        <p className="text-muted-foreground">
          {tp('s1AddressLabel', 'Address:')} <strong>{tp('address', '75000 Paris')}</strong>.
        </p>
        <p>
          {tp('s1ContactLabel', 'Privacy contact:')}{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            {tp('privacyEmail', 'privacy@zedos.app')}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s2Title', '2. Personal Data We Collect')}</h2>
        <p className="text-muted-foreground">
          {tp('s2Intro', 'Depending on how you use the Service, we may process:')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>{tp('s2L1Title', 'Account information')}</strong>: {tp('s2L1Body', 'email, login identifiers, and profile data.')}
          </li>
          <li>
            <strong>{tp('s2L2Title', 'Usage data')}</strong>: {tp('s2L2Body', 'visited pages, actions performed, timestamps, and technical logs required for operation and security.')}
          </li>
          <li>
            <strong>{tp('s2L3Title', 'User-provided content')}</strong>: {tp('s2L3Body', 'text, documents, and other data you submit for Service features (including AI features).')}
          </li>
          <li>
            <strong>{tp('s2L4Title', 'Support requests')}</strong>: {tp('s2L4Body', 'messages and interactions with our team.')}
          </li>
          <li>
            <strong>{tp('s2L5Title', 'Payments (if applicable)')}</strong>: {tp('s2L5Body', 'payment-related data processed via payment providers as needed to complete transactions.')}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s3Title', '3. Purposes of Processing')}</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{tp('s3L1', 'Provide, maintain, and secure the Service.')}</li>
          <li>{tp('s3L2', 'Manage your account and preferences.')}</li>
          <li>{tp('s3L3', 'Process your inputs to generate AI-powered outputs.')}</li>
          <li>{tp('s3L4', 'Provide customer support and respond to requests.')}</li>
          <li>
            {tp('s3L5', 'Comply with legal obligations (for example accounting and regulatory obligations).')}
          </li>
          <li>{tp('s3L6', 'Improve the Service and prevent fraud, in line with GDPR requirements.')}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s4Title', '4. Legal Basis (GDPR)')}</h2>
        <p className="text-muted-foreground">
          {tp('s4Intro', 'We process personal data in accordance with applicable law, including Regulation (EU) 2016/679 (“GDPR”). Legal bases include:')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>{tp('s4L1Title', 'Contract performance')}</strong> {tp('s4L1Body', '(Article 6(1)(b)): providing the Service and account-related operations.')}
          </li>
          <li>
            <strong>{tp('s4L2Title', 'Legal obligations')}</strong> {tp('s4L2Body', '(Article 6(1)(c)): processing required by law.')}
          </li>
          <li>
            <strong>{tp('s4L3Title', 'Legitimate interests')}</strong> {tp('s4L3Body', '(Article 6(1)(f)): security, fraud prevention, and Service improvement, subject to your rights.')}
          </li>
          <li>
            <strong>{tp('s4L4Title', 'Consent')}</strong> {tp('s4L4Body', '(Article 6(1)(a)): where required for optional processing.')}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s5Title', '5. Recipients')}</h2>
        <p className="text-muted-foreground">
          {tp('s5Intro', 'We may share personal data with:')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{tp('s5L1', 'technical processors (for example hosting and infrastructure providers);')}</li>
          <li>{tp('s5L2', 'payment providers (if applicable);')}</li>
          <li>{tp('s5L3', 'authorized internal staff (operations and support);')}</li>
          <li>{tp('s5L4', 'competent authorities when legally required.')}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s6Title', '6. International Data Transfers')}</h2>
        <p className="text-muted-foreground">
          {tp('s6Body', 'If we rely on providers outside the EU/EEA, we implement appropriate safeguards under GDPR (for example adequacy decisions, Standard Contractual Clauses, and supplementary measures).')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s7Title', '7. Data Retention')}</h2>
        <p className="text-muted-foreground">
          {tp('s7Intro', 'We retain personal data only for as long as needed for the purposes described:')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            {tp('s7L1', 'Account data: while your account remains active and as required to meet legal obligations and handle potential claims.')}
          </li>
          <li>
            {tp('s7L2', 'Security/technical logs: as required for diagnostics, security, and maintenance.')}
          </li>
          <li>
            {tp('s7L3', 'Request-related content: as needed to provide the Service and resolve disputes.')}
          </li>
        </ul>
        <p className="text-muted-foreground">
          {tp('s7Outro', 'For more details, contact us at privacy@zedos.app.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s8Title', '8. Cookies and Similar Technologies')}</h2>
        <p className="text-muted-foreground">
          {tp('s8P1', 'We may use cookies and similar technologies necessary for Service operation, security, and user experience.')}
        </p>
        <p className="text-muted-foreground">
          {tp('s8P2', 'Where optional cookies require consent, consent will be collected and managed in accordance with applicable law.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s9Title', '9. Your Rights (GDPR)')}</h2>
        <p className="text-muted-foreground">
          {tp('s9Intro', 'Under GDPR, you may have the following rights (depending on your situation):')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{tp('s9L1', 'Right of access.')}</li>
          <li>{tp('s9L2', 'Right to rectification.')}</li>
          <li>{tp('s9L3', 'Right to erasure (in some cases).')}</li>
          <li>{tp('s9L4', 'Right to object.')}</li>
          <li>{tp('s9L5', 'Right to restriction of processing.')}</li>
          <li>{tp('s9L6', 'Right to data portability (where applicable).')}</li>
          <li>{tp('s9L7', 'Right to withdraw consent where processing is based on consent.')}</li>
          <li>{tp('s9L8', 'Right to lodge a complaint with the CNIL.')}</li>
        </ul>
        <p>
          {tp('s9ContactLabel', 'To exercise your rights:')}{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            {tp('privacyEmail', 'privacy@zedos.app')}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s10Title', '10. AI Act: Transparency on AI Use')}</h2>
        <p className="text-muted-foreground">
          {tp('s10Intro', 'When you use AI features, your prompts and related usage information may be processed to generate outputs. We implement reasonable measures to comply with applicable transparency and compliance obligations.')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            {tp('s10L1', 'AI outputs may require human verification and can be inaccurate or incomplete.')}
          </li>
          <li>
            {tp('s10L2', 'The Service is an assistance tool; you remain responsible for how outputs are used.')}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s11Title', '11. Security Measures')}</h2>
        <p className="text-muted-foreground">
          {tp('s11Body', 'We apply technical and organizational safeguards to protect personal data against loss, unauthorized access, alteration, and disclosure.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s12Title', '12. Changes to This Policy')}</h2>
        <p className="text-muted-foreground">
          {tp('s12Body', 'We may update this policy from time to time. The update date appears at the top of this page.')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{tp('s13Title', '13. Contact')}</h2>
        <p>
          {tp('s13Label', 'For any questions:')}{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            {tp('privacyEmail', 'privacy@zedos.app')}
          </a>
        </p>
      </section>
    </main>
  );
}
