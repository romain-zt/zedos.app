export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Terms of Use
      </h1>

      <p className="text-muted-foreground">
        These Terms of Use govern access to and use of the Zedos service (the “Service”). By
        accessing or using the Service, you agree to these Terms.
      </p>

      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Last updated: <strong>May 27, 2026</strong>
        </p>

        <p className="text-muted-foreground">
          Note: this document is provided for general information and does not constitute legal
          advice.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Service Provider and Contact</h2>
        <p className="text-muted-foreground">
          The Service provider (“we”, “us”, “our”) is: <strong>ZedTech</strong>.
        </p>
        <p className="text-muted-foreground">
          Address: <strong>75000 Paris</strong>.
        </p>
        <p>
          Contact:{' '}
          <a className="underline" href="mailto:support@zedos.app">
            support@zedos.app
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Access to the Service</h2>
        <p className="text-muted-foreground">
          Access to certain features may require account registration.
        </p>
        <p className="text-muted-foreground">
          We may modify, suspend, or discontinue any part of the Service for maintenance, technical,
          security, or legal reasons.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. User Account</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>You are responsible for providing accurate registration information.</li>
          <li>
            You must keep your credentials secure and notify us promptly of unauthorized access.
          </li>
          <li>We may suspend accounts used in breach of these Terms.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
        <p className="text-muted-foreground">
          You agree to use the Service in compliance with applicable laws and these Terms.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>You must not bypass or attempt to bypass security controls.</li>
          <li>
            You must not use the Service for unlawful, fraudulent, or harmful activities.
          </li>
          <li>You must not upload or share content that is clearly illegal.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. User Content</h2>
        <p className="text-muted-foreground">
          You retain rights to your content. You grant us a limited license to process your content
          as necessary to provide and improve the Service.
        </p>
        <p className="text-muted-foreground">
          You represent that you have all rights required to submit the content you provide.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. AI Features (GDPR / AI Act)</h2>
        <p className="text-muted-foreground">
          Some Service features rely on AI systems. These systems may process information you provide
          (for example prompts and documents) to generate responses, summaries, or assistance.
        </p>

        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <strong>Transparency:</strong> AI outputs may be inaccurate or incomplete and must be
            reviewed before use.
          </li>
          <li>
            <strong>Human oversight:</strong> The Service assists users and does not replace human
            judgment.
          </li>
          <li>
            <strong>AI Act compliance:</strong> We implement reasonable measures to meet applicable
            transparency and usage obligations.
          </li>
        </ul>

        <p className="text-muted-foreground">
          Personal data processing related to AI features is further described in our
          <a className="underline" href="/legal/privacy">
            {' '}
            Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Payments (if applicable)</h2>
        <p className="text-muted-foreground">
          If you purchase subscriptions or credits, payments may be processed by third-party payment
          providers (for example Stripe), in accordance with applicable laws.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
        <p className="text-muted-foreground">
          The Service, including its software, interface, branding, and content, is protected by
          intellectual property laws. You may not copy, modify, distribute, or commercially exploit
          it without prior authorization.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Liability</h2>
        <p className="text-muted-foreground">
          To the maximum extent permitted by law, we are not liable for indirect, incidental, or
          consequential damages arising from use of the Service.
        </p>
        <p className="text-muted-foreground">
          Decisions made based on AI outputs remain your responsibility.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Suspension and Termination</h2>
        <p className="text-muted-foreground">
          We may suspend or terminate your access in case of serious breach of these Terms, security
          risks, or legal requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Governing Law</h2>
        <p className="text-muted-foreground">
          These Terms are governed by French law, subject to mandatory legal provisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">12. Changes to These Terms</h2>
        <p className="text-muted-foreground">
          We may update these Terms from time to time. The latest version date appears at the top of
          this page. Material changes may be notified to users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">13. Privacy Contact</h2>
        <p className="text-muted-foreground">
          For questions related to personal data processing, please refer to our{' '}
          <a className="underline" href="/legal/privacy">Privacy Policy</a>.
        </p>
      </section>
    </main>
  );
}
