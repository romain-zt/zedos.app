export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Privacy Policy (GDPR)
      </h1>

      <p className="text-muted-foreground">
        This policy explains how Zedos collects and processes personal data when you use our Service,
        including AI-powered features.
      </p>

      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Last updated: <strong>May 27, 2026</strong>
        </p>

        <p className="text-muted-foreground">
          Note: this document is provided for general information and may require legal validation
          depending on your operational setup.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Data Controller and Contact</h2>
        <p className="text-muted-foreground">
          The data controller (“we”, “us”, “our”) is <strong>ZedTech</strong>.
        </p>
        <p className="text-muted-foreground">
          Address: <strong>75000 Paris</strong>.
        </p>
        <p>
          Privacy contact:{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            privacy@zedos.app
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          2. Personal Data We Collect
        </h2>
        <p className="text-muted-foreground">
          Depending on how you use the Service, we may process:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>Account information</strong>: email, login identifiers, and profile data.
          </li>
          <li>
            <strong>Usage data</strong>: visited pages, actions performed, timestamps, and technical
            logs required for operation and security.
          </li>
          <li>
            <strong>User-provided content</strong>: text, documents, and other data you submit for
            Service features (including AI features).
          </li>
          <li>
            <strong>Support requests</strong>: messages and interactions with our team.
          </li>
          <li>
            <strong>Payments (if applicable)</strong>: payment-related data processed via payment
            providers as needed to complete transactions.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Purposes of Processing</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Provide, maintain, and secure the Service.</li>
          <li>Manage your account and preferences.</li>
          <li>Process your inputs to generate AI-powered outputs.</li>
          <li>Provide customer support and respond to requests.</li>
          <li>
            Comply with legal obligations (for example accounting and regulatory obligations).
          </li>
          <li>Improve the Service and prevent fraud, in line with GDPR requirements.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Legal Basis (GDPR)</h2>
        <p className="text-muted-foreground">
          We process personal data in accordance with applicable law, including Regulation (EU)
          2016/679 (“GDPR”). Legal bases include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>Contract performance</strong> (Article 6(1)(b)): providing the Service and
            account-related operations.
          </li>
          <li>
            <strong>Legal obligations</strong> (Article 6(1)(c)): processing required by law.
          </li>
          <li>
            <strong>Legitimate interests</strong> (Article 6(1)(f)): security, fraud prevention, and
            Service improvement, subject to your rights.
          </li>
          <li>
            <strong>Consent</strong> (Article 6(1)(a)): where required for optional processing.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Recipients</h2>
        <p className="text-muted-foreground">
          We may share personal data with:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>technical processors (for example hosting and infrastructure providers);</li>
          <li>payment providers (if applicable);</li>
          <li>authorized internal staff (operations and support);</li>
          <li>competent authorities when legally required.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. International Data Transfers</h2>
        <p className="text-muted-foreground">
          If we rely on providers outside the EU/EEA, we implement appropriate safeguards under GDPR
          (for example adequacy decisions, Standard Contractual Clauses, and supplementary measures).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Data Retention</h2>
        <p className="text-muted-foreground">
          We retain personal data only for as long as needed for the purposes described:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            Account data: while your account remains active and as required to meet legal obligations
            and handle potential claims.
          </li>
          <li>
            Security/technical logs: as required for diagnostics, security, and maintenance.
          </li>
          <li>
            Request-related content: as needed to provide the Service and resolve disputes.
          </li>
        </ul>
        <p className="text-muted-foreground">
          For more details, contact us at privacy@zedos.app.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Cookies and Similar Technologies</h2>
        <p className="text-muted-foreground">
          We may use cookies and similar technologies necessary for Service operation, security, and
          user experience.
        </p>
        <p className="text-muted-foreground">
          Where optional cookies require consent, consent will be collected and managed in accordance
          with applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Your Rights (GDPR)</h2>
        <p className="text-muted-foreground">
          Under GDPR, you may have the following rights (depending on your situation):
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Right of access.</li>
          <li>Right to rectification.</li>
          <li>Right to erasure (in some cases).</li>
          <li>Right to object.</li>
          <li>Right to restriction of processing.</li>
          <li>Right to data portability (where applicable).</li>
          <li>Right to withdraw consent where processing is based on consent.</li>
          <li>Right to lodge a complaint with the CNIL.</li>
        </ul>
        <p>
          To exercise your rights:{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            privacy@zedos.app
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. AI Act: Transparency on AI Use</h2>
        <p className="text-muted-foreground">
          When you use AI features, your prompts and related usage information may be processed to
          generate outputs. We implement reasonable measures to comply with applicable transparency
          and compliance obligations.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            AI outputs may require human verification and can be inaccurate or incomplete.
          </li>
          <li>
            The Service is an assistance tool; you remain responsible for how outputs are used.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Security Measures</h2>
        <p className="text-muted-foreground">
          We apply technical and organizational safeguards to protect personal data against loss,
          unauthorized access, alteration, and disclosure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">12. Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this policy from time to time. The update date appears at the top of this
          page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">13. Contact</h2>
        <p>
          For any questions:{' '}
          <a className="underline" href="mailto:privacy@zedos.app">
            privacy@zedos.app
          </a>
        </p>
      </section>
    </main>
  );
}
