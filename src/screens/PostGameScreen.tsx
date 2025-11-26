import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { SavannahBackground } from '../components/SavannahBackground';
import { ScoreBadge } from '../components/ScoreBadge';
import { games } from '../modules/games/registry';
import type { GameResult, LeaderboardEntry, ScreenId } from '../types';
import { countryData } from '../utils/countryData';
import { flagpackMap } from '../utils/flagpack';
import { LEADERBOARD_LIMIT } from '../constants/leaderboard';
import './screens.css';

interface PostGameScreenProps {
  result?: GameResult;
  leaderboard: LeaderboardEntry[];
  onNavigate: (screen: ScreenId) => void;
  onSaveLeaderboardEntry: (entry: LeaderboardEntry) => void;
}

const trophyImages: Record<'gold' | 'silver' | 'bronze', string> = {
  gold: '/media/images/gold.png',
  silver: '/media/images/silver.png',
  bronze: '/media/images/bronze.png'
};

const CLASSIFICATION_AUDIO_SOURCES = {
  'Cloud Nine': '/media/audio/cloud-nine.mp3',
  'Business Class': '/media/audio/business-class.mp3',
  'Economy Class': '/media/audio/economy-class.mp3'
} as const;

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ label, value, color }: StatCardProps) => {
  return (
    <div
      className="stat-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        minWidth: 0
      }}
    >
      <span
        className="stat-card__label"
        style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.9)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </span>
      <span
        className="stat-card__value"
        style={{
          marginLeft: 'auto',
          fontWeight: 700,
          color
        }}
      >
        {value}
      </span>
    </div>
  );
};

// New function to handle flag logic for leaderboard entries
const getFlagImageForEntry = (entry: LeaderboardEntry) => {
  // Robust lookup: Normalize country names for a reliable match
  const normalizedEntryCountry = entry.country.trim().toLowerCase();
  const info = countryData.find(
    (country) => country.name.trim().toLowerCase() === normalizedEntryCountry
  );

  // If info is not found or has no iso3 code, return the globe emoji
  if (!info || !info.iso3) return <span style={{ fontSize: '1.2rem' }}>🌍</span>;

  // CRITICAL: Convert info.iso3 to lowercase for a reliable map key lookup
  const flagSrc = flagpackMap[info.iso3.toLowerCase()];

  // Render the flag image if a source path is found, otherwise use the fallback globe emoji
  return flagSrc ? (
    <img
      src={flagSrc}
      alt={info.name}
      className="flagpack-icon" // Uses the global.css class
    />
  ) : (
    <span style={{ fontSize: '1.2rem' }}>🌍</span>
  );
};

export const PostGameScreen = ({
  result,
  leaderboard,
  onNavigate,
  onSaveLeaderboardEntry
}: PostGameScreenProps) => {
  const currentGame = games[0];

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const baseScore = (result?.correct ?? 0) * 500 - (result?.incorrect ?? 0) * 500;
  const streakPoints = result?.streakBonusTotal ?? 0;
  const totalScore = result?.score ?? baseScore + streakPoints;

  const attempts = (result?.correct ?? 0) + (result?.incorrect ?? 0);
  const accuracy = attempts > 0 ? Math.round(((result?.correct ?? 0) / attempts) * 100) : 0;

  const performance = useMemo(() => getPerformanceBand(accuracy), [accuracy]);
  const encouragement = useMemo(() => getEncouragement(totalScore), [totalScore]);

  const [typedMessage, setTypedMessage] = useState(encouragement);

  const bonusAudio = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const audio = new Audio('/media/audio/bonus.mp3');
    audio.preload = 'auto';
    return audio;
  }, []);

  const playBonusSound = useCallback(() => {
    if (!bonusAudio) return;
    bonusAudio.currentTime = 0;
    const attempt = bonusAudio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => undefined);
    }
  }, [bonusAudio]);

  const modalSoundTriggeredRef = useRef(false);
  const classificationAudioRef = useRef<Record<string, HTMLAudioElement>>({});

  const qualifiesForLeaderboard = useMemo(() => {
    if (!result) return false;
    if (leaderboard.length < LEADERBOARD_LIMIT) return true;
    const threshold = leaderboard[leaderboard.length - 1]?.score ?? Number.NEGATIVE_INFINITY;
    return totalScore > threshold;
  }, [leaderboard, result, totalScore]);

  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('lastLeaderboardName') ?? '';
  });
  const [playerCountry, setPlayerCountry] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('lastLeaderboardCountry') ?? '';
  });
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (qualifiesForLeaderboard && !hasSaved) {
      if (!modalSoundTriggeredRef.current) {
        playBonusSound();
        modalSoundTriggeredRef.current = true;
      }
    } else {
      modalSoundTriggeredRef.current = false;
    }
  }, [qualifiesForLeaderboard, hasSaved, playBonusSound]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const entries = Object.fromEntries(
      Object.entries(CLASSIFICATION_AUDIO_SOURCES).map(([classification, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        return [classification, audio];
      })
    ) as Record<string, HTMLAudioElement>;
    classificationAudioRef.current = entries;
    return () => {
      Object.values(entries).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    if (qualifiesForLeaderboard && !hasSaved) return;
    if (showLeaderboard) return;
    const classificationAudio =
      classificationAudioRef.current[performance.classification];
    if (!classificationAudio) return;
    classificationAudio.currentTime = 0;
    const attempt = classificationAudio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => undefined);
    }
  }, [performance.classification, qualifiesForLeaderboard, hasSaved, showLeaderboard, result]);

  // Country autocomplete state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [highlightedCountryIndex, setHighlightedCountryIndex] = useState(0);

  const filteredCountries = useMemo(() => {
    const query = playerCountry.trim().toLowerCase();
    if (!query || query.length < 1) return [];
    return countryData.filter((country) => country.name.toLowerCase().startsWith(query));
  }, [playerCountry]);

  useEffect(() => {
    setHighlightedCountryIndex(0);
  }, [playerCountry]);

  // Typing effect – disabled while the player is entering a leaderboard name
  useEffect(() => {
    if (qualifiesForLeaderboard && !hasSaved) {
      setTypedMessage(encouragement);
      return;
    }

    let index = 0;
    setTypedMessage('');

    let typingInterval: number | undefined;
    const typingDelay = window.setTimeout(() => {
      typingInterval = window.setInterval(() => {
        index += 1;
        setTypedMessage(encouragement.slice(0, index));
        if (index >= encouragement.length && typingInterval) {
          window.clearInterval(typingInterval);
        }
      }, 35);
    }, 500);

    return () => {
      window.clearTimeout(typingDelay);
      if (typingInterval) {
        window.clearInterval(typingInterval);
      }
    };
  }, [encouragement, qualifiesForLeaderboard, hasSaved]);

  const handleSaveScore = () => {
    if (!playerName.trim() || !playerCountry.trim()) return;

    // force match to countryData
    const match = countryData.find(
      (c) => c.name.toLowerCase() === playerCountry.trim().toLowerCase()
    );

    if (!match) {
      alert("Please select a valid country from the list.");
      return;
    }

    onSaveLeaderboardEntry({
      id: `${Date.now()}`,
      name: playerName.trim(),
      country: match.name, // ALWAYS full country name
      score: totalScore
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lastLeaderboardName', playerName.trim());
      window.localStorage.setItem('lastLeaderboardCountry', match.name);
    }

    playBonusSound();

    setHasSaved(true);
    setShowLeaderboard(true);
  };


  const handleCountryKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isCountryDropdownOpen || filteredCountries.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedCountryIndex((prev) =>
        prev + 1 >= filteredCountries.length ? 0 : prev + 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedCountryIndex((prev) =>
        prev - 1 < 0 ? filteredCountries.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = filteredCountries[highlightedCountryIndex];
      if (chosen) {
        setPlayerCountry(chosen.name);
        setIsCountryDropdownOpen(false);
      }
    } else if (event.key === 'Escape') {
      setIsCountryDropdownOpen(false);
    }
  };

  return (
    <SavannahBackground>
      <div className="quiz-hero">
        <div className="quiz-panel animate-in post-game-panel">
          <header className="post-game__header">
            <div className="post-game__masthead">
              <h2>FLIGHT DECK REPORT</h2>
            </div>
            <div className="post-game__logos">
              <img src="/media/images/afrikanaonelogo.png" alt="Afrika Na One" />
              <img src="/media/images/ethiopian.jpg" alt="Ethiopian Airlines" />
              <img src="/media/images/ElebiLogoTransp2024.png" alt="Elebi Labs" />
            </div>
          </header>

       <div className="post-game__motivation">
  <div className="trophy-wrapper">
    <img
      src={trophyImages[performance.trophy]}
      alt={performance.title}
      className="trophy-img"
    />
  </div>

  <div className="post-game__text-block">
    <p className="post-game__summary typing-text">{typedMessage}</p>

    <p className="post-game__classification">
      CLASSIFICATION:&nbsp;
      <strong>{performance.classification}</strong>
    </p>
  </div>
</div>
          <div className="post-game__stats">
            <StatCard
              label="Correct"
              value={result?.correct ?? 0}
              color="#1DB954"
            />
            <StatCard
              label="Incorrect"
              value={result?.incorrect ?? 0}
              color="#FF4B4B"
            />
            <StatCard label="Score" value={baseScore} color="#3794FF" />
            <StatCard
              label="Streak points"
              value={streakPoints}
              color="#FF9800"
            />
          </div>

<div className="post-game__total-score">
  <span className="rainbow-score">TOTAL SCORE</span>
  &nbsp;
  <span className="rainbow-value">{totalScore}</span>
</div>

          <div className="post-game__actions">
            <button className="cta-button post-game__cta-button" onClick={() => onNavigate('game')}>
              <span className="post-game__cta-copy">
                <strong>Replay</strong>
                <p>Take another lap around the continent.</p>
              </span>
            </button>
            <button className="cta-button post-game__cta-button" onClick={() => setShowLeaderboard(true)}>
              <span className="post-game__cta-copy">
                <strong>Leaderboard</strong>
                <p>Compare scores with fellow travelers.</p>
              </span>
            </button>
            <button className="cta-button post-game__cta-button" onClick={() => onNavigate('goodbye')}>
              <span className="post-game__cta-copy">
                <strong>Exit</strong>
                <p>Return to Bole International Airport.</p>
              </span>
            </button>
          </div>
        </div>
      </div>
{qualifiesForLeaderboard && !hasSaved && (
  <div className="quiz-modal">
    <div className="quiz-modal__content modern-modal">
      <div className="modern-modal__header">
        <h3>🎉 New High Altitude Score!</h3>
        <p className="modern-modal__subtitle">
          You reached a new milestone on this trivia flight.
        </p>
      </div>

      <div className="modern-modal__form">
        <label className="modern-field">
          <span>Name</span>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
        </label>

        <label className="modern-field">
          <span>Country</span>

          <div className="country-autocomplete" style={{ position: 'relative' }}>
            {/* your autocomplete input is unchanged */}
            <input
              value={playerCountry}
              onChange={(e) => {
                setPlayerCountry(e.target.value);
                if (e.target.value.trim().length >= 1) {
                  setIsCountryDropdownOpen(true);
                } else {
                  setIsCountryDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (playerCountry.trim().length >= 1) {
                  setIsCountryDropdownOpen(true);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => setIsCountryDropdownOpen(false), 120);
              }}
              onKeyDown={handleCountryKeyDown}
              placeholder="Start typing your country"
            />

            {/* keep your existing dropdown */}
            {isCountryDropdownOpen && filteredCountries.length > 0 && (
              <ul
                className="country-autocomplete__list"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: 'auto',
                  margin: 0,
                  padding: '4px 0',
                  listStyle: 'none',
                  background: 'rgba(0,0,0,0.85)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  zIndex: 20
                }}
              >
                {filteredCountries.map((country, index) => {
                  const isActive = index === highlightedCountryIndex;
                  const info = country;
                  const flagSrc = flagpackMap[info.iso3];
                  return (
                    <li key={info.iso3}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPlayerCountry(info.name);
                          setIsCountryDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '6px 10px',
                          border: 'none',
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.12)'
                            : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span
                          style={{ display: 'inline-flex', width: 24 }}
                        >
                          {flagSrc ? (
                            <img
                              src={flagSrc}
                              alt={info.name}
                              style={{
                                width: 24,
                                height: 16,
                                objectFit: 'cover',
                                borderRadius: 2
                              }}
                            />
                          ) : (
                            info.flag ?? '🌍'
                          )}
                        </span>
                        <span>{info.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </label>
      </div>

      <div className="modern-modal__actions">
        <button className="quiz-action" onClick={handleSaveScore}>
          Save Score
        </button>

        <button
          className="quiz-action quiz-action--secondary"
          onClick={() => setHasSaved(true)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      {showLeaderboard && (
        <div className="quiz-modal">
          <div className="quiz-modal__content quiz-modal__content--leaderboard">
            <div className="savannah-frame-inner">
              <div className="quiz-modal__header">
                <h3>Cabin leaderboard</h3>
                <button
                  className="quiz-action quiz-action--secondary"
                  onClick={() => setShowLeaderboard(false)}
                >
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
                    const info = countryData.find(
                      (country) => country.name === entry.country
                    );
                    return (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td>{entry.name}</td>
                        <td>{entry.country}</td>
                        <td>{info?.iso3 ?? '—'}</td>
<td>
  {(() => {
    // If info is not found or has no iso3 code, return the globe emoji
    if (!info || !info.iso3) return <span style={{ fontSize: '1.2rem' }}>🌍</span>;

    // *** CRITICAL CHANGE: Convert info.iso3 to lowercase for a reliable map key lookup ***
    const flagSrc = flagpackMap[info.iso3.toLowerCase()];

    // Render the flag image if a source path is found, otherwise use the fallback globe emoji
    return flagSrc ? (
      <img
        src={flagSrc}
        alt={info.name}
        className="flagpack-icon" // Uses the global.css class
      />
    ) : (
      <span style={{ fontSize: '1.2rem' }}>🌍</span>
    );
  })()}
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
      trophy: 'gold' as const,
      color: '#d4af37'
    };
  }
  if (accuracy >= 60) {
    return {
      title: 'Savannah Silver',
      classification: 'Business Class',
      trophy: 'silver' as const,
      color: '#c0c0c0'
    };
  }
  return {
    title: 'Bronze Voyager',
    classification: 'Economy Class',
    trophy: 'bronze' as const,
    color: '#cd7f32'
  };
};
