function Team() {
  const members = [
    { name: 'Karan Desai', department: 'Product and Technology', initials: 'KD', color: 'from-purple-500 to-pink-500' },
    { name: 'Dan Morgan', department: 'Retail', initials: 'DM', color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Meet Our Team</h2>
        <p className="text-gray-400">The Vibe Tribe — Social Committee bringing fun to Entain!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {members.map((member) => (
          <div key={member.name} className="bg-entain-navy rounded-xl border border-entain-blue/20 p-6 text-center hover:border-entain-accent/40 transition">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-4`}>
              <span className="text-white text-2xl font-bold">{member.initials}</span>
            </div>
            <h3 className="text-white font-semibold text-lg">{member.name}</h3>
            <p className="text-entain-accent text-sm mt-1">{member.department}</p>
            <p className="text-gray-500 text-xs mt-2">Social Committee Member</p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-entain-navy rounded-xl border border-entain-blue/20 p-6 text-center">
        <p className="text-gray-400 text-sm">
          We organise events, activities, and fun initiatives to bring the team together. 
          FIFA 2026 Predictions is one of our projects — built for Entain employees to enjoy the World Cup together! ⚽
        </p>
        <p className="text-gray-500 text-xs mt-3">Want to join the committee? Reach out to any member above.</p>
      </div>
    </div>
  );
}

export default Team;
