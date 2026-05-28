function Info() {
  const handleExport = () => {
    // Create a printable version in a new window
    const content = document.getElementById('info-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>World Cup 2026 Predictions - Rules & Info</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
            h3 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
            p { font-size: 13px; color: #444; margin-bottom: 12px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>📋 World Cup 2026 Entain Predictions</h1>
          <p style="color:#888;">Official Rules & How It Works — Exported ${new Date().toLocaleDateString('en-GB')}</p>
          ${content.innerHTML.replace(/class="[^"]*"/g, '').replace(/className="[^"]*"/g, '')}
          <div class="footer">
            <p>Organised by Vibe Tribe — Social Committee | Virtual currency only. No real money involved.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">📋 Official Rules & How It Works</h2>
        <button
          onClick={handleExport}
          className="bg-entain-accent text-entain-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-entain-accent/90 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">FIFA 2026 Entain Predictions — Full Terms of Participation</p>

      <div id="info-content">

      {/* Overview */}
      <div className="bg-entain-navy rounded-xl p-6 border border-entain-blue/20 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">1. Overview</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          FIFA 2026 Entain Predictions is an internal, fun prediction game exclusively for Entain Group employees. Participants use virtual Entain Points (EP) to predict outcomes of FIFA 2026 World Cup matches. <span className="text-entain-gold font-semibold">No real money is involved at any stage.</span> This is a social engagement activity organised by the Vibe Tribe Social Committee.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">

        <Section title="2. Eligibility & Registration" items={[
          { label: 'Who can participate?', desc: 'All Entain Group employees worldwide, regardless of department, role, or location.' },
          { label: 'How to register', desc: 'Register using your @entaingroup.com email address. Your account must be approved by an administrator before you can participate.' },
          { label: 'Opt-in participation', desc: 'Participation is entirely voluntary. Employees opt in by registering on the platform. There is no obligation to participate.' },
          { label: 'One account per person', desc: 'Each employee may only register one account. Duplicate accounts will be removed.' },
        ]} />

        <Section title="3. Entain Points (EP) — Virtual Currency" items={[
          { label: 'Starting balance', desc: 'Every approved participant receives 100 EP upon account activation. All participants start with the same balance — no exceptions.' },
          { label: 'What are EP?', desc: 'Entain Points are a virtual, non-monetary currency used solely within this platform. They have no cash value and cannot be exchanged, transferred, or redeemed for real money.' },
          { label: 'Earning EP', desc: 'Win predictions (stake × odds returned to your balance), or receive admin-awarded bonuses (e.g. group stage completion bonus of 50 EP).' },
          { label: 'Spending EP', desc: 'Place predictions on match outcomes. Your stake is deducted immediately upon confirmation.' },
          { label: 'Running out of EP', desc: 'If your balance reaches 0, you cannot place further predictions until you earn EP through winning bets or receiving bonuses.' },
        ]} />

        <Section title="4. What Predictions Are Accepted" items={[
          { label: 'Match Result (1X2)', desc: 'Predict the outcome of a match: Home Win, Draw, or Away Win. Odds are displayed on each match card.' },
          { label: 'Odds format', desc: 'All odds are displayed in decimal format (e.g. 2.50 means a 1 EP stake returns 2.50 EP if correct).' },
          { label: 'Dynamic odds', desc: 'Odds shift based on prediction volume — if many participants back the same outcome, those odds shorten. This mirrors real market behaviour.' },
          { label: 'Odds are locked at placement', desc: 'You receive the odds displayed at the moment you confirm your prediction. Subsequent changes do not affect placed bets.' },
        ]} />

        <Section title="5. When Can Predictions Be Placed?" items={[
          { label: 'Available 24/7', desc: 'Predictions can be placed at any time — during office hours, evenings, or weekends. There are no time-of-day restrictions.' },
          { label: 'Why no time restriction?', desc: 'Entain operates across multiple time zones (UK, India, Australia, Gibraltar, etc.). Restricting to specific hours would disadvantage colleagues in certain regions.' },
          { label: 'Cutoff', desc: 'Betting closes automatically 1 minute before the scheduled kickoff time. This is enforced by the system — no late predictions are accepted.' },
          { label: 'Office hours note', desc: 'While the platform is accessible during work hours, we encourage participants to engage during breaks or outside core working time. This is a fun activity, not a distraction.' },
        ]} />

        <Section title="6. Leaderboard & Rankings" items={[
          { label: 'Composite score', desc: 'Rankings are determined by a composite score combining two factors: EP Balance (60%) and Win Rate (40%).' },
          { label: 'Minimum requirement', desc: 'You must place at least 1 prediction during the tournament to appear on the leaderboard.' },
          { label: 'EP Balance (60%)', desc: 'Your current Entain Points balance — reflects overall success and smart bankroll management.' },
          { label: 'Win Rate (40%)', desc: 'Your prediction accuracy (wins ÷ total bets). Rewards quality picks over blind volume.' },
          { label: 'Why not just EP?', desc: 'A pure EP ranking would favour lucky single large bets. The composite score rewards consistent accuracy alongside EP growth.' },
          { label: 'Tiebreaker', desc: 'If two participants have the same score, the one with more total bets placed ranks higher (rewarding engagement).' },
        ]} />

        <Section title="7. Entain Tag System & Referral Competition" items={[
          { label: 'What are Entain Tags?', desc: 'Tags are earned by referring colleagues to the platform. They represent your rank in the Referral Competition leaderboard.' },
          { label: 'How referrals work', desc: 'Share your unique referral code (found on the Home page). When a colleague registers using your code and is approved, your referral count increases.' },
          { label: 'Referral Leaderboard', desc: 'Compete with others to see who can refer the most people. Check the Referrals tab on the Leaderboard page to see your rank.' },
          { label: 'Tags are badges', desc: 'Tags unlock as you hit referral milestones (Silver at 3, Gold at 5, Diamond at 10, etc). They do not affect odds — odds are the same for everyone.' },
        ]} />

        {/* Tag Thresholds Table */}
        <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-entain-blue/10">
            <h3 className="text-white font-semibold">Entain Tag Tiers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-entain-blue/20">
                  <th className="text-left text-gray-400 px-5 py-3">Tag</th>
                  <th className="text-center text-gray-400 px-4 py-3">Referrals Required</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">👤 Employee</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">0 (default)</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">⚡ Silver</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">3+</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">✨ Gold</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">5+</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">💎 Diamond</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">10+</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">👑 Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">20+</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">⚡👑 Silver Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">30+</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">✨👑 Gold Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">40+</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 text-white">💎👑 Diamond Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">50+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Section title="8. Prizes" items={[
          { label: 'Leaderboard prizes', desc: 'Prizes for top finishers will be announced by the Social Committee before the tournament begins. These may include vouchers, merchandise, or other non-monetary rewards.' },
          { label: 'No cash prizes', desc: 'Under no circumstances will real money be awarded. All prizes are non-monetary in nature.' },
          { label: 'Prize eligibility', desc: 'Only active participants (those who have placed at least one prediction) are eligible for prizes.' },
        ]} />

        <Section title="9. Bet Reference Numbers" items={[
          { label: 'Unique bet number', desc: 'Every prediction placed is assigned a unique reference number in the format EFIFA0001, EFIFA0002, etc.' },
          { label: 'Where to find it', desc: 'Your bet number is shown in the confirmation notification, on the My Bets page (click it for full details), and in the admin panel.' },
          { label: 'Purpose', desc: 'Bet numbers allow you and admins to quickly identify and look up any specific prediction.' },
        ]} />

        <Section title="10. Conditional Bets (Responsible Play)" items={[
          { label: 'What triggers a conditional bet?', desc: 'If you attempt to stake 80% or more of your current EP balance in a single prediction, the bet is flagged as a Conditional Bet.' },
          { label: 'What happens?', desc: 'Your EP is deducted and the bet is created with a "Conditional Bet" status (yellow). It requires admin approval before it becomes active.' },
          { label: 'Admin review', desc: 'An administrator will review and either approve or reject the bet. You will be notified of the outcome.' },
          { label: 'If approved', desc: 'The bet status changes to "Bet Placed" (green) and proceeds as normal.' },
          { label: 'If rejected', desc: 'The bet is cancelled and your staked EP is fully refunded to your balance.' },
          { label: 'Why?', desc: 'This safeguard ensures participants don\'t accidentally exhaust their entire balance on a single prediction, keeping the game fun for the full tournament.' },
        ]} />

        <Section title="11. Settlement & Results" items={[
          { label: 'How results are settled', desc: 'Match results are sourced from official FIFA data. Once a match is completed, all predictions are automatically settled.' },
          { label: 'Winning predictions', desc: 'If your prediction is correct, your payout (stake × odds) is credited to your EP balance immediately.' },
          { label: 'Losing predictions', desc: 'If your prediction is incorrect, the staked EP is lost. No refunds are issued for losing predictions.' },
          { label: 'Void bets', desc: 'In exceptional circumstances (e.g. match cancellation), an administrator may void predictions and refund stakes.' },
        ]} />

        <Section title="12. Group Stage Completion Bonus" items={[
          { label: 'Bonus award', desc: 'When all 72 group stage matches have been completed, every registered participant receives a 50 EP bonus to use in the knockout rounds.' },
          { label: 'Automatic', desc: 'This bonus is awarded automatically by the system — no action required from participants.' },
          { label: 'Purpose', desc: 'This ensures all participants have EP available for the knockout stage, even if their group stage predictions were unsuccessful.' },
        ]} />

        <Section title="13. Fair Play & Conduct" items={[
          { label: 'No manipulation', desc: 'Any attempt to manipulate the platform, create multiple accounts, or exploit system vulnerabilities will result in account suspension.' },
          { label: 'Respectful communication', desc: 'The group chat and messaging features are for friendly discussion. Abusive, discriminatory, or inappropriate content will not be tolerated.' },
          { label: 'Admin discretion', desc: 'Administrators reserve the right to adjust balances, void predictions, or suspend accounts if rules are breached.' },
        ]} />

        <Section title="14. Responsible Play" items={[
          { label: 'For fun only', desc: 'This platform is designed as a social engagement activity. It uses virtual currency with no real-world monetary value.' },
          { label: 'Not gambling', desc: 'As no real money is staked, won, or lost, this does not constitute gambling under any jurisdiction.' },
          { label: 'High-stake protection', desc: 'If you stake 80% or more of your balance, the bet becomes a Conditional Bet requiring admin approval (see Section 10).' },
          { label: 'Voluntary participation', desc: 'You may stop participating at any time. There is no obligation to place predictions or maintain activity.' },
        ]} />

        <Section title="15. Platform Features" items={[
          { label: 'AI Assistant', desc: 'An AI chatbot (bottom-right) can answer questions about matches, teams, odds, and how to use the platform.' },
          { label: 'Group Chat', desc: 'A real-time chat for all participants to discuss matches, share tips, and engage socially.' },
          { label: 'Notifications', desc: 'You receive notifications for: prediction results, bonuses, admin announcements, and referral updates.' },
          { label: 'Mobile friendly', desc: 'The platform works on mobile browsers. Add to your home screen for an app-like experience.' },
          { label: 'Auto-updates', desc: 'When a new version is deployed, you receive a prompt to refresh — no manual action needed.' },
        ]} />

        <Section title="16. Data & Privacy" items={[
          { label: 'Data collected', desc: 'Name, company email, department, and country (office location). No personal financial data is collected.' },
          { label: 'Internal use only', desc: 'All data is used solely for the operation of this platform and will not be shared externally.' },
          { label: 'Account deletion', desc: 'You may request account deletion at any time by contacting an administrator.' },
        ]} />

        <Section title="17. Contact & Support" items={[
          { label: 'Platform issues', desc: 'Contact Karan Desai (karan.desai@entaingroup.com) for technical support or account issues.' },
          { label: 'Rule queries', desc: 'For questions about rules, prizes, or participation, reach out to the Vibe Tribe Social Committee.' },
          { label: 'Feedback', desc: 'Suggestions and feedback are welcome via the group chat or direct message to an admin.' },
        ]} />

      </div>

      {/* Footer */}
      </div>{/* end info-content */}
      <div className="mt-8 bg-entain-navy rounded-xl p-5 border border-entain-blue/20 text-center">
        <p className="text-gray-400 text-sm">Organised by <a href="/team" className="text-entain-accent hover:underline">Vibe Tribe — Social Committee</a></p>
        <p className="text-gray-500 text-xs mt-1">Virtual currency only. No real money involved. Play responsibly. ⚽</p>
        <p className="text-gray-600 text-xs mt-2">Last updated: May 2026</p>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-entain-blue/10">
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="px-5 py-3 space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-white text-sm font-medium">{item.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Info;
