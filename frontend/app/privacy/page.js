'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 sm:px-6 lg:px-8 py-24 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Privacy Policy</h1>

          <div className="space-y-6 text-sm text-slate-500 dark:text-dark-mute leading-relaxed">
            <p><strong className="text-slate-700 dark:text-slate-300">Last updated:</strong> July 2026</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account (name, email address) and using the Service (financial transactions, receipt images, budget settings).</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">2. How We Use Your Information</h2>
            <p>Your data is used solely to provide and improve the Service. This includes processing transactions, generating reports, and providing OCR scanning functionality. We do not sell your personal information.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">3. Data Security</h2>
            <p>We implement industry-standard encryption and security measures to protect your data. All data is transmitted over HTTPS and stored with encryption at rest.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">5. Third-Party Services</h2>
            <p>We do not share your data with third parties except as necessary to provide the Service (e.g., hosting providers) or as required by law.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may also export your data at any time using the export feature.</p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">7. Contact</h2>
            <p>For privacy-related inquiries, please contact us at privacy@spendly.app.</p>
          </div>
        </main>

        <Footer />
      </div>
  );
}
