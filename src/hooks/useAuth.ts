'use client';

import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result
    getRedirectResult(auth).catch((error) => {
      console.error('Erreur de redirection:', error);
      setError('Une erreur est survenue lors de la connexion');
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (signingIn) return; // Prevent multiple clicks
    setError(null);
    setSigningIn(true);
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      // Try popup first
      await signInWithPopup(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      console.log('Popup error code:', authError.code);
      
      // If popup is blocked or cancelled, fallback to redirect
      if (authError.code === 'auth/popup-blocked' || 
          authError.code === 'auth/cancelled-popup-request' ||
          authError.code === 'auth/popup-closed-by-user' ||
          authError.code === 'auth/unauthorized-domain') {
        console.log('Falling back to redirect method');
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Erreur de redirection:', redirectError);
          setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
          setSigningIn(false);
        }
      } else {
        console.error('Erreur de connexion:', error);
        setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        setSigningIn(false);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      setError('Une erreur est survenue lors de la déconnexion');
    }
  };

  return {
    user,
    loading,
    signingIn,
    error,
    signIn,
    signOut,
  };
} 