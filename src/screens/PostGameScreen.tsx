import { useEffect, useMemo, useState } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { SavannahBackground } from '../components/SavannahBackground';
import { ScoreBadge } from '../components/ScoreBadge';
import { games } from '../modules/games/registry';
import type { GameResult, LeaderboardEntry, ScreenId } from '../types';
import { countryData } from '../utils/countryData';
import { flagpackMap } from '../utils/flagpack';
import './screens.css';

interface PostGameScreenProps {
  result?: GameResult;
  leaderboard: LeaderboardEntry[];
  onNavigate: (screen: ScreenId) => void;
  onSaveLeaderboardEntry: (entry: LeaderboardEntry) => void;
}

export const PostGameScreen = ({ result, leaderboard, onNavigate, onSaveLeaderboardEntry }: PostGameScreenProps) => {
  const currentGame = games[0];
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const baseScore = (result?.correct ?? 0) * 100 - (result?.incorrect ?? 0) * 25;
  const streakPoints = Math.max(0, (result?.streak ?? 0) * 100);
  const totalScore = baseScore + streakPoints;
  const attempts = (result?.correct ?? 0) + (result?.incorrect ?? 0);
  const accuracy = attempts > 0 ? Math.round(((result?.correct ?? 0) / attempts) * 100) : 0;
  const encouragement = useMemo(() => getEncouragement(totalScore), [totalScore]);
  const [typedMessage, setTypedMessage] = useState(encouragement);
  const performance = useMemo(() => getPerformanceBand(accuracy), [accuracy]);
  const qualifiesForLeaderboard = useMemo(() => {
    if (!result) return false;
    if (leaderboard.length < 5) return true;
    const threshold = leaderboard[leaderboard.length - 1]?.score ?? 0;
    return totalScore > threshold;
  }, [leaderboard, result, totalScore]);
  const [playerName, setPlayerName] = useState('');
  const [playerCountry, setPlayerCountry] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setTypedMessage('');
    let index = 0;
    const text = encouragement;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedMessage(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 35);
    return () => window.clearInterval(timer);
  }, [encouragement]);

  return (
    <SavannahBackground>
      <div className="quiz-hero">
        <div className="quiz-panel animate-in post-game-panel">
          <header className="post-game__header">
            <div className="post-game__masthead">
              <h2>Flight deck report</h2>
            </div>
            <div className="post-game__logos">
              <img src="/media/images/afrikanaonelogo.png" alt="Afrika Na One" />
              <img src="/media/images/ethiopian.jpg" alt="Ethiopian Airlines" />
              <img src="/media/images/ElebiLogoTransp2024.png" alt="Elebi Labs" />
            </div>
          </header>

          <div className="post-game__motivation">
            <div className="post-game__trophy" style={{ color: performance.color }}>
              <span role="img" aria-label={`${performance.title} trophy`}>
                {performance.icon}
              </span>
            </div>
            <p className="post-game__summary typing-text">{typedMessage}</p>
            <p className="post-game__classification">
              Performance Classification: <strong>{performance.classification}</strong>
            </p>
          </div>

          <div className="post-game__stats">
            <ScoreBadge label="Correct" value={result?.correct ?? 0} />
            <ScoreBadge label="Incorrect" value={result?.incorrect ?? 0} variant="neutral" />
            <ScoreBadge label="Score" value={baseScore} />
            <ScoreBadge label="Streak points" value={streakPoints} />
          </div>
          <div className="post-game__total-score">
            <ScoreBadge label="Total score" value={totalScore} />
          </div>

          {qualifiesForLeaderboard && !hasSaved && (
            <div className="leaderboard-prompt">
              <p>New high-altitude score! Save it to the cabin leaderboard.</p>
              <div className="leaderboard-form">
                <label>
                  Name
                  <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Type your name" />
                </label>
                <label>
                  Country
                  <input
                    value={playerCountry}
                    onChange={(e) => setPlayerCountry(e.target.value)}
                    list="country-options"
                    placeholder="Select country"
                  />
                  <datalist id="country-options">
                    {countryData.map((country) => (
                      <option key={country.iso3} value={country.name}>
                        {country.flag}
                      </option>
                    ))}
                  </datalist>
                </label>
                <button
                  className="quiz-action"
                  onClick={() => {
                    if (!playerName.trim() || !playerCountry.trim()) {
                      return;
                    }
                    onSaveLeaderboardEntry({
                      id: `${Date.now()}`,
                      name: playerName.trim(),
                      country: playerCountry.trim(),
                      score: totalScore
                    });
                    setHasSaved(true);
                    setShowLeaderboard(true);
                  }}
                >
                  Save score
                </button>
              </div>
            </div>
          )}

          <div className="post-game__actions">
            <button className="menu-button" onClick={() => onNavigate('game')}>
              <span className="menu-button__icon" aria-hidden>
                🔁
              </span>
              <span>
                <strong>Replay</strong>
                <p>Take another lap over the continent.</p>
              </span>
            </button>
            <button className="menu-button" onClick={() => setShowLeaderboard(true)}>
              <span className="menu-button__icon" aria-hidden>
                🏆
              </span>
              <span>
                <strong>Leaderboard</strong>
                <p>Compare scores with fellow travelers.</p>
              </span>
            </button>
            <button className="menu-button" onClick={() => onNavigate('goodbye')}>
              <span className="menu-button__icon" aria-hidden>
                ✈️
              </span>
              <span>
                <strong>Exit</strong>
                <p>Return to the Ethiopian Airlines portal.</p>
              </span>
            </button>
          </div>
        </div>
      </div>

      {showLeaderboard && (
        <div className="quiz-modal">
          <div className="quiz-modal__content quiz-modal__content--leaderboard">
            <div className="savannah-frame-inner">
            <div className="quiz-modal__header">
              <h3>Cabin leaderboard</h3>
              <button className="quiz-action quiz-action--secondary" onClick={() => setShowLeaderboard(false)}>
                Close
              </button>
            </div>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Country</th>
                  <th>ISO</th>
                  <th>Flag</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const info = countryData.find((country) => country.name === entry.country);
                  return (
                    <tr key={entry.id}>
                      <td>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.country}</td>
                      <td>{info?.iso3 ?? '—'}</td>
                      <td>
                        {info && flagpackMap[info.iso3]
                          ? (
                              <img src={flagpackMap[info.iso3]} alt={info.name} className="flagpack-icon" />
                            )
                          : (
                              info?.flag ?? '🌍'
                            )}
                      </td>
                      <td>{entry.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </SavannahBackground>
  );
};

const extraordinarySentences = [
  'You soared higher than Kilimanjaro—bravo!',
  'You hunted answers like a Maasai warrior at dawn.',
  'Brains brighter than the Sahara sun!',
  'You navigated trivia like the Nile through Africa.',
  'Legends are carved on the baobab tree. Yours is there now.',
  'You danced across questions like a master of Kizomba.',
  'Your wisdom could power the Great Ethiopian Renaissance Dam.',
  'You read the savannah like ancient griots read the stars.',
  'Your answers sprinted faster than cheetahs.',
  'Your mind is richer than Congo’s mineral veins.'
];

const solidSentences = [
  'Your journey rivals a calm cruise on Lake Victoria.',
  'You dodged obstacles like Dakar rally drivers.',
  'You stood tall like the pillars of Lalibela.',
  'The Serengeti applauds your performance.',
  'You kept rhythm like a djembe storyteller.',
  'Steady as the Atlas Mountains, well done.',
  'You crossed the quiz Sahara without losing your way.',
  'Your knowledge is as dependable as the Nile’s flow.',
  'Tribes would gather round to hear this tale.',
  'You lit the night sky like Johannesburg’s skyline.'
];

const encouragementSentences = [
  'Even the baobab started from a seed—keep growing.',
  'Rains return after every dry season. So will victories.',
  'Mali empires rose after setbacks. Yours will too.',
  'Keep tuning your wisdom like a kora string.',
  'Every Maasai warrior earned scars before glory.',
  'The Sahara teaches patience. So does trivia.',
  'Mist over Table Mountain always clears. Stay ready.',
  'Tomorrow’s sunrise over Lake Malawi is yours.',
  'Great journeys reroute before reaching Cape Town.',
  'Your next approach flight will stick the landing.'
];

const countryOptions = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
];

const getEncouragement = (score: number) => {
  if (score <= 0) {
    return encouragementSentences[Math.floor(Math.random() * encouragementSentences.length)];
  }
  if (score >= 700) {
    return extraordinarySentences[Math.floor(Math.random() * extraordinarySentences.length)];
  }
  if (score >= 400) {
    return solidSentences[Math.floor(Math.random() * solidSentences.length)];
  }
  return encouragementSentences[Math.floor(Math.random() * encouragementSentences.length)];
};

const getPerformanceBand = (accuracy: number) => {
  if (accuracy >= 80) {
    return {
      title: 'African Gold',
      classification: 'Cloud Nine',
      icon: '🏆',
      color: '#d4af37'
    };
  }
  if (accuracy >= 60) {
    return {
      title: 'Savannah Silver',
      classification: 'Business Class',
      icon: '🥈',
      color: '#c0c0c0'
    };
  }
  return {
    title: 'Bronze Voyager',
    classification: 'Economy Class',
    icon: '🥉',
    color: '#cd7f32'
  };
};
