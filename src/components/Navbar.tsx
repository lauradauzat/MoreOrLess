'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import '@/styles/navbar.css';

export default function Navbar() {
  const { user, signIn, signOut } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href="/" className="logo-container">
            <Image
              src="/images/logo.png"
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
              >
                <ArrowRightOnRectangleIcon className="button-icon" />
                Connexion
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 