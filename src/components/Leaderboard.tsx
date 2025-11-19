import type { LeaderboardEntry } from '../types';
import './Leaderboard.css';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export const Leaderboard = ({ entries }: LeaderboardProps) => (
  <div className="leaderboard">
    {entries.map((entry, index) => (
      <article key={entry.id} className="leaderboard__item">
        <div>
          <span className="leaderboard__rank">#{index + 1}</span>
          <strong>{entry.name}</strong>
          <p>{entry.country}</p>
        </div>
        <strong className="leaderboard__score">{entry.score}</strong>
      </article>
    ))}
  </div>
);
