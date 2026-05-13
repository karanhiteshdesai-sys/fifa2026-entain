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
          { label: 'Correct Score', desc: 'Predict the exact final score (e.g., 2-1). Higher risk, higher reward (odds 5.5x to 25x).' },
          { label: 'Total Goals', desc: 'Over/Under 1.5, 2.5, or 3.5 total goals in the match.' },
          { label: 'Both Teams to Score', desc: 'Will both teams score at least one goal? Yes or No.' },
          { label: 'First to Score', desc: 'Which team scores first? Or will it be 0-0 (No Goal)?' },
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
          { label: 'Earning EP', desc: 'Win bets, refer employees (+25 EP per referral), or receive admin bonuses.' },
          { label: 'Spending EP', desc: 'Place bets. Your stake is deducted immediately. If you win, you get stake × odds back.' },
        ]} />

        <Section title="🎁 Referral Program" items={[
          { label: 'Your referral code', desc: 'Find it on the Home page (top-right). It looks like FIFA-KAR5F2J.' },
          { label: 'How it works', desc: 'Share your code with a colleague. They enter it during registration.' },
          { label: 'Bonus', desc: 'You earn 25 EP when the referred employee is approved by admin.' },
        ]} />

        <Section title="🏆 Leaderboard" items={[
          { label: 'Ranking', desc: 'Based on total EP balance. Win more bets = climb higher.' },
          { label: 'Stats tracked', desc: 'Total bets, win rate, total winnings — all visible on the leaderboard.' },
        ]} />

        <Section title="💬 Group Chat" items={[
          { label: 'Real-time chat', desc: 'Talk with all employees. Discuss matches, share tips, banter.' },
          { label: 'Notifications', desc: 'Everyone gets notified when a new message is posted.' },
        ]} />

        <Section title="📱 Other Features" items={[
          { label: 'Search', desc: 'Search matches by team name, date, time, or venue on the Matches page.' },
          { label: 'Group filters', desc: 'Filter matches by group (A through L) or view all.' },
          { label: 'Transactions', desc: 'View all EP credits and debits in My Bets → Transactions tab.' },
          { label: 'Notifications', desc: 'Bell icon (top-right) shows bet results, referral bonuses, admin messages.' },
          { label: 'Mobile friendly', desc: 'Works on phone browsers. Add to home screen for app-like experience.' },
          { label: 'Auto timezone', desc: 'Match times automatically display in your local timezone.' },
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
