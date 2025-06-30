'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import '@/styles/navbar.css';

// Get basePath from environment or default to empty string
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Navbar() {
  const { user, signingIn, signIn, signOut } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href="/" className="logo-container">
            <Image
              src={`${basePath}/images/logo.png`}
              alt="PlusOuMoins Logo"
              width={32}
              height={32}
              className="logo"
            />
            <span className="logo-text">PlusOuMoins</span>
          </Link>
          
          <div className="nav-links">
            {user ? (
              <div className="user-section">
                <span className="welcome-text">
                  Bienvenue, {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="logout-button"
                >
                  <ArrowLeftOnRectangleIcon className="button-icon" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="login-button"
                disabled={signingIn}
              >
                <ArrowRightOnRectangleIcon className="button-icon" />
                {signingIn ? 'Connexion...' : 'Connexion'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 