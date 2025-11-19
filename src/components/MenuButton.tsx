import type { ReactNode } from 'react';
import './MenuButton.css';

interface MenuButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export const MenuButton = ({ icon, title, subtitle, onClick }: MenuButtonProps) => (
  <button className="menu-button" onClick={onClick}>
    <span className="menu-button__icon" aria-hidden>
      {icon}
    </span>
    <span>
      <strong>{title}</strong>
      <p>{subtitle}</p>
    </span>
  </button>
);
