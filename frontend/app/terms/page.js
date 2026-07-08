import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 sm:px-6 lg:px-8 py-24 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Terms of Service</h1>

          <div className="space-y-6 text-sm text-slate-500 dark:text-dark-mute leading-relaxed">
            <p><strong className="text-slate-700 dark:text-slate-300">Last updated:</strong> July 2026</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Spendly (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">2. Description of Service</h2>
            <p>Spendly is a personal expense tracking application that provides tools for recording, categorizing, and analyzing financial transactions. The Service includes OCR receipt scanning, budget forecasting, and data export features.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree not to misuse the Service or attempt to access it through unauthorized means.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">4. Data Privacy</h2>
            <p>We take your privacy seriously. Your financial data is encrypted and never shared with third parties without your explicit consent. Please refer to our Privacy Policy for more details.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">5. Limitations of Liability</h2>
            <p>Spendly is provided &quot;as is&quot; without warranties of any kind. We are not responsible for any financial decisions made based on the data presented in the Service. Always consult a professional financial advisor for important decisions.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Users will be notified of material changes via email or through the Service.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">7. Contact</h2>
            <p>For questions about these terms, please contact us at support@spendly.app.</p>
          </div>
        </main>

        <Footer />
      </div>
  );
}
