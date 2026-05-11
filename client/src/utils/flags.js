// Country code mapping for flag emojis
const countryFlags = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Czechia': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Haiti': '🇭🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turkiye': '🇹🇷',
  'Germany': '🇩🇪',
  'Curacao': '🇨🇼',
  'Ivory Coast': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱',
  'Japan': '🇯🇵',
  'Sweden': '🇸🇪',
  'Tunisia': '🇹🇳',
  'Belgium': '🇧🇪',
  'Egypt': '🇪🇬',
  'Iran': '🇮🇷',
  'New Zealand': '🇳🇿',
  'Spain': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Saudi Arabia': '🇸🇦',
  'Uruguay': '🇺🇾',
  'France': '🇫🇷',
  'Senegal': '🇸🇳',
  'Iraq': '🇮🇶',
  'Norway': '🇳🇴',
  'Argentina': '🇦🇷',
  'Algeria': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordan': '🇯🇴',
  'Portugal': '🇵🇹',
  'DR Congo': '🇨🇩',
  'Uzbekistan': '🇺🇿',
  'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croatia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦',
};

export function getFlag(teamName) {
  return countryFlags[teamName] || '🏳️';
}

export function teamWithFlag(teamName) {
  return `${getFlag(teamName)} ${teamName}`;
}
