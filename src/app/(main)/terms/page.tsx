export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Terms & Conditions
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 8, 2026
      </p>

      <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
        {/* 1. Acceptance */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>

          <p>
            By accessing or using the Wild Soul Club website, creating an
            account, or placing an order, you agree to be bound by these Terms
            &amp; Conditions.
          </p>

          <p className="mt-3">
            If you do not agree with these terms, please do not use our
            services.
          </p>
        </section>

        {/* 2. Accounts */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            2. Accounts
          </h2>

          <p>
            Some features of Wild Soul Club may require you to create or sign
            in to an account.
          </p>

          <p className="mt-3">
            You are responsible for providing accurate information and for
            maintaining the security of your account.
          </p>

          <p className="mt-3">
            You must notify us if you believe your account has been accessed or
            used without authorization.
          </p>
        </section>

        {/* 3. Google Sign-In */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            3. Google Sign-In
          </h2>

          <p>
            Wild Soul Club may allow you to create or access your account using
            Google Sign-In.
          </p>

          <p className="mt-3">
            When using Google Sign-In, your use of Google's services remains
            subject to Google's applicable terms and privacy policies.
          </p>

          <p className="mt-3">
            Google Sign-In is provided as a convenient authentication method
            and does not give Wild Soul Club access to services such as your
            Gmail, Google Drive, Google Calendar, or Google Contacts.
          </p>
        </section>

        {/* 4. Products */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            4. Products and Pricing
          </h2>

          <p>
            All prices displayed on Wild Soul Club are in Myanmar Kyat (MMK)
            unless otherwise stated.
          </p>

          <p className="mt-3">
            We reserve the right to modify product prices, availability,
            descriptions, promotions, and other product information at any
            time.
          </p>

          <p className="mt-3">
            We make reasonable efforts to display products accurately.
            However, colors, appearance, and other details may vary slightly
            depending on photography, screens, manufacturing, or other factors.
          </p>
        </section>

        {/* 5. Orders */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            5. Orders and Payment
          </h2>

          <p>
            By placing an order, you agree to provide accurate and complete
            information required to process and deliver your purchase.
          </p>

          <p className="mt-3">
            Wild Soul Club may accept payment methods including KBZPay, Wave
            Money, AYA Pay, and CB Pay.
          </p>

          <p className="mt-3">
            Orders are considered confirmed only after the applicable payment
            has been received and verified.
          </p>

          <p className="mt-3">
            We reserve the right to refuse or cancel an order where reasonably
            necessary, including in cases of incorrect pricing, unavailable
            stock, suspected fraud, or payment verification issues.
          </p>
        </section>

        {/* 6. Shipping */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            6. Shipping and Delivery
          </h2>

          <p>
            Wild Soul Club provides delivery to supported locations. Available
            delivery areas, charges, and estimated delivery times may vary
            depending on your location.
          </p>

          <p className="mt-3">
            Delivery times are estimates and may be affected by courier
            operations, weather, public holidays, transportation conditions, or
            other circumstances beyond our reasonable control.
          </p>
        </section>

        {/* 7. Returns */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            7. Returns and Exchanges
          </h2>

          <p>
            We accept eligible return or exchange requests within 7 days of
            delivery for defective or incorrect items.
          </p>

          <p className="mt-3">
            Returned items must be unworn, unused, and returned with their
            original tags and packaging where applicable.
          </p>

          <p className="mt-3">
            To request a return or exchange, contact us at{" "}
            <a
              href="mailto:wildsoulclubofficial@gmail.com"
              className="font-medium text-foreground underline underline-offset-4"
            >
              wildsoulclubofficial@gmail.com
            </a>
            .
          </p>
        </section>

        {/* 8. Intellectual Property */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            8. Intellectual Property
          </h2>

          <p>
            Unless otherwise stated, content available on the Wild Soul Club
            website, including our name, branding, logos, graphics, product
            photography, designs, website content, and text, is owned by or
            licensed to Wild Soul Club.
          </p>

          <p className="mt-3">
            You may not reproduce, distribute, modify, or commercially use this
            content without permission.
          </p>
        </section>

        {/* 9. Acceptable Use */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            9. Acceptable Use
          </h2>

          <p>You agree not to misuse the Wild Soul Club website, including:</p>

          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Attempting unauthorized access to accounts or systems</li>
            <li>Using the website for fraudulent activity</li>
            <li>Interfering with the operation or security of the website</li>
            <li>
              Using automated systems in a way that disrupts our services
            </li>
            <li>Submitting false or misleading order information</li>
          </ul>
        </section>

        {/* 10. Third-party services */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            10. Third-Party Services
          </h2>

          <p>
            Certain Wild Soul Club features may rely on third-party providers
            for authentication, infrastructure, payment processing, delivery,
            and other services.
          </p>

          <p className="mt-3">
            We are not responsible for interruptions or failures caused solely
            by third-party services outside our reasonable control.
          </p>
        </section>

        {/* 11. Liability */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            11. Limitation of Liability
          </h2>

          <p>
            To the extent permitted by applicable law, Wild Soul Club will not
            be liable for indirect, incidental, special, or consequential
            damages arising from your use of our website, services, or
            products.
          </p>

          <p className="mt-3">
            Nothing in these Terms excludes or limits liability where such
            liability cannot legally be excluded or limited.
          </p>
        </section>

        {/* 12. Privacy */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            12. Privacy
          </h2>

          <p>
            Your use of Wild Soul Club is also subject to our{" "}
            <a
              href="/privacy"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </a>
            , which explains how we collect, use, and protect personal
            information.
          </p>
        </section>

        {/* 13. Changes */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            13. Changes to These Terms
          </h2>

          <p>
            We may update these Terms &amp; Conditions from time to time.
            Changes will be posted on this page along with an updated revision
            date.
          </p>

          <p className="mt-3">
            Continued use of Wild Soul Club after updated terms become
            effective constitutes acceptance of the revised terms where
            permitted by applicable law.
          </p>
        </section>

        {/* 14. Contact */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            14. Contact
          </h2>

          <p>
            If you have questions about these Terms &amp; Conditions, please
            contact us at{" "}
            <a
              href="mailto:wildsoulclubofficial@gmail.com"
              className="font-medium text-foreground underline underline-offset-4"
            >
              wildsoulclubofficial@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}