import './ScoreBadge.css';

interface ScoreBadgeProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'neutral';
}

export const ScoreBadge = ({ label, value, variant = 'primary' }: ScoreBadgeProps) => (
  <div className={`score-badge score-badge--${variant}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
