'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import '@/styles/footer.css';

export default function Footer() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="footer">
      <div className="footer-content">
        <nav className="footer-nav">
          <Link 
            href="/" 
            className={`footer-link ${pathname === '/' ? 'active' : ''}`}
          >
            Accueil
          </Link>
          <Link 
            href="/dashboard" 
            className={`footer-link ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Tableau de bord
          </Link>
          <Link 
            href="/mentions-legales" 
            className={`footer-link ${pathname === '/mentions-legales' ? 'active' : ''}`}
          >
            Mentions légales
          </Link>
        </nav>

        <div className="footer-actions">
          <button
            onClick={toggleTheme}
            className="dark-mode-toggle"
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </footer>
  );
} 