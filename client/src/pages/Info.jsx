function Info() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">ℹ️ How It Works</h2>

      {/* Overview */}
      <div className="bg-entain-navy rounded-xl p-6 border border-entain-blue/20 mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">Welcome to FIFA 2026 Entain Predictions!</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          This is a fun, internal prediction game for Entain employees. You start with <span className="text-entain-gold font-bold">20 EP</span> (Entain Points) and use them to bet on FIFA 2026 World Cup matches. No real money involved — just bragging rights and leaderboard glory!
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">

        <Section title="🎯 Bet Types" items={[
          { label: 'Match Winner', desc: 'Predict Home, Draw, or Away. Odds are dynamic — they shift as more bets come in.' },
        ]} />

        <Section title="📊 Dynamic Odds" items={[
          { label: 'How they work', desc: 'Match Winner odds start at realistic bookmaker values and shift based on bet volume.' },
          { label: 'More bets on one side', desc: 'If everyone bets Home, Home odds drop and Away odds rise — just like real betting markets.' },
          { label: 'Your odds are locked', desc: 'You get the odds at the time you place your bet. Later changes don\'t affect you.' },
        ]} />

        <Section title="⏰ Betting Cutoff" items={[
          { label: '1 minute before kickoff', desc: 'Betting closes automatically 1 minute before the match starts. Buttons turn gray and show 🔒.' },
          { label: 'Server enforced', desc: 'Even if you try to bypass the UI, the backend rejects late bets.' },
        ]} />

        <Section title="💰 Entain Points (EP)" items={[
          { label: 'Starting balance', desc: 'Every new user gets 20 EP upon account approval.' },
          { label: 'Earning EP', desc: 'Win bets or receive admin bonuses.' },
          { label: 'Spending EP', desc: 'Place bets. Your stake is deducted immediately. If you win, you get stake × odds back.' },
        ]} />

        <Section title="🎁 Referral Program" items={[
          { label: 'Your referral code', desc: 'Find it on the Home page (top-right). It looks like FIFA-KAR5F2J.' },
          { label: 'How it works', desc: 'Share your code with a colleague. They enter it during registration.' },
          { label: 'Reward', desc: 'More referrals = higher VIP Tag = better odds boost on every bet you place.' },
        ]} />

        <Section title="🏆 Leaderboard" items={[
          { label: 'Ranking', desc: 'Based on total EP balance. Win more bets = climb higher.' },
          { label: 'Stats tracked', desc: 'Total bets, win rate, total winnings — all visible on the leaderboard.' },
        ]} />

        <Section title="🏷️ VIP Tag System" items={[
          { label: 'What are Tags?', desc: 'Tags are VIP tiers earned by referring colleagues. Higher tags give better odds on every bet.' },
          { label: 'VIP Card', desc: 'View your virtual VIP card on the Home page. Tap to flip and reveal your tag.' },
        ]} />

        {/* Tag Thresholds Table */}
        <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-entain-blue/10">
            <h3 className="text-white font-semibold">📈 Tag Thresholds & Odds Boost</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-entain-blue/20">
                  <th className="text-left text-gray-400 px-5 py-3">Tag</th>
                  <th className="text-center text-gray-400 px-4 py-3">Referrals Needed</th>
                  <th className="text-center text-gray-400 px-4 py-3">Odds Boost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">👤 Employee</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">0 (default)</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">—</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">⚡ Silver</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">3+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+5%</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">✨ Gold</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">5+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+10%</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">💎 Diamond</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">10+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+15%</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">👑 Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">20+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+20%</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">⚡👑 Silver Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">30+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+25%</td>
                </tr>
                <tr className="border-b border-entain-blue/10">
                  <td className="px-5 py-2.5 text-white">✨👑 Gold Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">40+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+30%</td>
                </tr>
                <tr>
                  <td className="px-5 py-2.5 text-white">💎👑 Diamond Diplomat</td>
                  <td className="px-4 py-2.5 text-center text-gray-300">50+</td>
                  <td className="px-4 py-2.5 text-center text-entain-green font-bold">+35%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-entain-blue/10">
            <p className="text-gray-500 text-xs">💡 Odds boost is applied automatically when you place a bet. The higher your tag, the better your payout!</p>
          </div>
        </div>

        <Section title="🤖 AI Assistant" items={[
          { label: 'Ask anything', desc: 'Click the bot icon (bottom-right) to ask about matches, teams, groups, dates, or how to use the app.' },
          { label: 'Place bets by voice or text', desc: 'Say "bet 5 on England to win" and the AI will place it for you with a confirmation step.' },
          { label: 'Voice input', desc: 'Click the 🎤 mic button to speak your question. The bot also reads answers aloud.' },
          { label: 'Webapp help', desc: 'Ask how to change password, place a bet, check leaderboard — it knows the app inside out.' },
        ]} />

        <Section title="📢 Broadcasts & Notifications" items={[
          { label: 'Admin broadcasts', desc: 'Important messages from admin appear as a popup on your screen instantly.' },
          { label: 'Bet notifications', desc: 'Get notified when your bet wins or loses, when points are added, or when you get a new referral.' },
          { label: 'Auto-updates', desc: 'When a new version is deployed, you get a popup to refresh — no manual hard refresh needed.' },
        ]} />

        <Section title="💬 Group Chat" items={[
          { label: 'Real-time chat', desc: 'Talk with all employees. Discuss matches, share tips, banter.' },
          { label: 'Typing indicator', desc: 'See who is typing in real-time when the chat is open.' },
          { label: 'Unread badge', desc: 'A red badge shows how many new messages you have when the chat is closed.' },
          { label: 'Notifications', desc: 'Everyone gets notified when a new message is posted.' },
        ]} />

        <Section title="📱 Other Features" items={[
          { label: 'Search', desc: 'Search matches by team name, date, time, or venue on the Matches page.' },
          { label: 'Group filters', desc: 'Filter matches by group (A through L) or view all.' },
          { label: 'Knockout bracket', desc: 'After group stage, knockout matches are auto-generated based on standings.' },
          { label: 'Live polling', desc: 'Once the tournament starts, real match results are fetched automatically and bets are settled.' },
          { label: 'Notifications', desc: 'Bell icon (top-right) shows bet results, referral updates, admin messages.' },
          { label: 'Mobile friendly', desc: 'Works on phone browsers. Add to home screen for app-like experience.' },
        ]} />

      </div>

      {/* Footer */}
      <div className="mt-8 bg-entain-navy rounded-xl p-5 border border-entain-blue/20 text-center">
        <p className="text-gray-400 text-sm">Built by <a href="/team" className="text-entain-accent hover:underline">Vibe Tribe - Social Committee</a></p>
        <p className="text-gray-500 text-xs mt-1">For fun only. No real money. Play responsibly! ⚽</p>
        <a href="/team" className="inline-block mt-3 text-entain-accent text-sm hover:underline">👋 Click here to meet our Social Committee team →</a>
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
