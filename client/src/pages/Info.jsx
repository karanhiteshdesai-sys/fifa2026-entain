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

        <Section title="🏷️ VIP Tag System" items={[
          { label: 'What are Tags?', desc: 'Tags are VIP tiers earned by referring colleagues. Higher tags give better odds on every bet.' },
          { label: 'Employee (default)', desc: 'Everyone starts here. Base odds, no boost.' },
          { label: '🥈 Silver (3+ referrals)', desc: '+5% odds boost on all bets.' },
          { label: '🥇 Gold (5+ referrals)', desc: '+10% odds boost on all bets.' },
          { label: '💎 Diamond (10+ referrals)', desc: '+15% odds boost on all bets.' },
          { label: '🎖️ Diplomat (20+ referrals)', desc: '+20% odds boost on all bets.' },
          { label: '🥈🎖️ Silver Diplomat (30+)', desc: '+25% odds boost on all bets.' },
          { label: '🥇🎖️ Gold Diplomat (40+)', desc: '+30% odds boost on all bets.' },
          { label: '💎🎖️ Diamond Diplomat (50+)', desc: '+35% odds boost — the maximum tier!' },
          { label: 'VIP Card', desc: 'View your virtual VIP card on the Home page. Tap to flip and reveal your tag.' },
        ]} />

        <Section title="🤖 AI Assistant" items={[
          { label: 'Ask anything', desc: 'Click the bot icon (bottom-right) to ask about matches, teams, groups, dates, or how to use the app.' },
          { label: 'Place bets by voice or text', desc: 'Say "bet 5 on England to win" and the AI will place it for you with a confirmation step.' },
          { label: 'Voice input', desc: 'Click the 🎤 mic button to speak your question. The bot also reads answers aloud.' },
          { label: 'Webapp help', desc: 'Ask how to change password, place a bet, check leaderboard — it knows the app inside out.' },
        ]} />

        <Section title="📢 Broadcasts & Notifications" items={[
          { label: 'Admin broadcasts', desc: 'Important messages from admin appear as a popup on your screen instantly.' },
          { label: 'Bet notifications', desc: 'Get notified when your bet wins or loses, when points are added, or when you get a referral bonus.' },
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
          { label: 'Notifications', desc: 'Bell icon (top-right) shows bet results, referral bonuses, admin messages.' },
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
