export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using IJBoba 606 (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              IJBoba 606 is an educational web application that provides:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Interactive quizzes about PAYE (Pay As You Earn) taxation</li>
              <li>A community forum for tax-related discussions</li>
              <li>A personal income tax calculator</li>
              <li>Gamification features (badges, streaks, leaderboards)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">3. Educational Purpose Disclaimer</h2>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-4">
              <p className="text-yellow-900 font-bold mb-2">⚠️ IMPORTANT DISCLAIMER</p>
              <p className="text-yellow-800 mb-2">
                This Service is provided for <strong>educational and informational purposes only</strong>. It is NOT:
              </p>
              <ul className="list-disc list-inside text-yellow-800 space-y-1 ml-4">
                <li>Legal advice</li>
                <li>Tax advice</li>
                <li>Financial advice</li>
                <li>Professional consultation</li>
              </ul>
              <p className="text-yellow-800 mt-4">
                The tax calculator provides estimates based on general rules and may not reflect your specific situation. Always consult with a qualified tax professional or the relevant tax authority for advice specific to your circumstances.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">4. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Account Types</h3>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li><strong>Guest (Anonymous):</strong> Limited features, data may be lost if you clear browser data</li>
              <li><strong>Google Account:</strong> Full features, persistent data storage</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Account Responsibilities</h3>
            <p className="text-gray-700 mb-4">You are responsible for:</p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Maintaining the security of your account</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">5. Forum Community Guidelines</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Acceptable Use</h3>
            <p className="text-gray-700 mb-4">When using the forum, you agree NOT to:</p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Post offensive, abusive, or discriminatory content</li>
              <li>Harass, threaten, or impersonate others</li>
              <li>Share personal information of others without consent</li>
              <li>Post spam, advertisements, or irrelevant content</li>
              <li>Provide professional tax/legal advice (educational discussion is ok)</li>
              <li>Upload malicious code or viruses</li>
              <li>Manipulate votes or game the system</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Moderation</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to moderate, edit, or remove any content that violates these terms. Moderators can hide posts, lock threads, and take other actions to maintain community standards.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Content Ownership</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you post, but grant us a license to display, distribute, and store your content as part of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">6. Calculator Accuracy</h2>
            <p className="text-gray-700 mb-4">
              The tax calculator is based on configurable rules that attempt to reflect Nigerian PAYE tax laws. However:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Rules may be out of date or incorrect</li>
              <li>Your actual tax may differ due to specific circumstances</li>
              <li>We make no warranties about the accuracy of calculations</li>
              <li>We are not liable for any decisions based on calculator results</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content (excluding user-generated content) are owned by IJBoba 606 and are protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, IJBoba 606 shall not be liable for:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of data or profits</li>
              <li>Decisions made based on information from the Service</li>
              <li>Errors or inaccuracies in content</li>
              <li>Service interruptions or downtime</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">9. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive to provide continuous service but do not guarantee:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
              <li>Uninterrupted access</li>
              <li>Error-free operation</li>
              <li>Specific uptime percentages</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify, suspend, or discontinue the Service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">10. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">11. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">13. Contact</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us through the footer links or GitHub repository.
            </p>
          </section>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-8">
            <p className="text-blue-900 font-semibold mb-2">By using IJBoba 606, you acknowledge that:</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1 ml-4">
              <li>You have read and understood these Terms</li>
              <li>You agree to be bound by these Terms</li>
              <li>The Service is for educational purposes only</li>
              <li>You will consult professionals for actual tax advice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


