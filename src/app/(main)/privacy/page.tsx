export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 8, 2026
      </p>

      <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
        {/* 1. Information We Collect */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            1. Information We Collect
          </h2>

          <p>
            We collect information you provide directly to us when you create
            an account, place an order, contact us, or otherwise use Wild Soul
            Club.
          </p>

          <p className="mt-3">
            This information may include your name, email address, phone number,
            shipping address, account information, order details, and payment
            information related to your purchase.
          </p>
        </section>

        {/* 2. Google Sign-In */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            2. Google Sign-In
          </h2>

          <p>
            Wild Soul Club offers Google Sign-In as an optional way to create
            and access your Wild Soul Club account.
          </p>

          <p className="mt-3">
            When you choose to sign in with Google, we may receive basic account
            information from Google, such as your name, email address, profile
            picture, and a unique identifier associated with your Google
            account.
          </p>

          <p className="mt-3">
            We use this information only to authenticate you, create or identify
            your Wild Soul Club account, manage your profile, and provide
            account-related features such as order management.
          </p>

          <p className="mt-3">
            Wild Soul Club does not use Google Sign-In to access your Gmail,
            Google Drive, Google Calendar, Google Contacts, or other Google
            services.
          </p>

          <p className="mt-3">
            We do not sell, rent, or use information received from Google for
            advertising purposes.
          </p>
        </section>

        {/* 3. How We Use Your Information */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            3. How We Use Your Information
          </h2>

          <p>We may use the information we collect to:</p>

          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Create, authenticate, and manage your account</li>
            <li>Process and fulfill your orders</li>
            <li>Manage shipping and delivery</li>
            <li>Communicate with you about your orders and account</li>
            <li>
              Send marketing communications where you have provided consent
            </li>
            <li>Provide customer support</li>
            <li>Improve our website, products, and services</li>
            <li>Detect, prevent, and investigate fraud or misuse</li>
            <li>Maintain the security of our website and accounts</li>
          </ul>
        </section>

        {/* 4. Information Sharing */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            4. Information Sharing
          </h2>

          <p>
            We do not sell your personal information.
          </p>

          <p className="mt-3">
            We may share information with trusted service providers when
            necessary to operate Wild Soul Club, authenticate users, process
            orders and payments, provide website infrastructure, or deliver
            purchases.
          </p>

          <p className="mt-3">
            These providers are permitted to process information only as needed
            to provide their services to us and are expected to protect that
            information appropriately.
          </p>

          <p className="mt-3">
            We may also disclose information when required by law or when
            reasonably necessary to protect the rights, security, and safety of
            Wild Soul Club, our customers, or others.
          </p>
        </section>

        {/* 5. Authentication and Service Providers */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            5. Authentication and Service Providers
          </h2>

          <p>
            Wild Soul Club may use third-party service providers to operate
            certain parts of the website, including authentication, hosting,
            database services, storage, and other technical infrastructure.
          </p>

          <p className="mt-3">
            Google may process information when you choose Google Sign-In in
            accordance with Google's own privacy policies. Our authentication
            infrastructure may also process the information necessary to
            securely create and maintain your Wild Soul Club account.
          </p>
        </section>

        {/* 6. Data Security */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            6. Data Security
          </h2>

          <p>
            We implement reasonable administrative and technical security
            measures designed to protect your personal information against
            unauthorized access, loss, misuse, alteration, or disclosure.
          </p>

          <p className="mt-3">
            However, no method of transmission or storage over the Internet can
            be guaranteed to be completely secure.
          </p>
        </section>

        {/* 7. Data Retention */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            7. Data Retention
          </h2>

          <p>
            We retain personal information only for as long as reasonably
            necessary to provide our services, maintain your account, fulfill
            orders, comply with legal obligations, resolve disputes, and
            protect our legitimate business interests.
          </p>

          <p className="mt-3">
            If you request deletion of your account, we will delete or
            anonymize personal information that is no longer required, subject
            to any information we must retain for legal, accounting, fraud
            prevention, or transaction-record purposes.
          </p>
        </section>

        {/* 8. Your Rights */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            8. Your Rights
          </h2>

          <p>
            Depending on applicable law, you may have the right to:
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Access personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </section>

        {/* 9. Account Deletion */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            9. Account Deletion
          </h2>

          <p>
            You may request deletion of your Wild Soul Club account and
            associated personal information by contacting us at{" "}
            <a
              href="mailto:wildsoulclubofficial@gmail.com"
              className="font-medium text-foreground underline underline-offset-4"
            >
              wildsoulclubofficial@gmail.com
            </a>
            .
          </p>
        </section>

        {/* 10. Changes to This Policy */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            10. Changes to This Privacy Policy
          </h2>

          <p>
            We may update this Privacy Policy from time to time. When changes
            are made, we will update the date displayed at the top of this
            page.
          </p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            11. Contact
          </h2>

          <p>
            If you have questions about this Privacy Policy, your personal
            information, or Google Sign-In, please contact us at{" "}
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