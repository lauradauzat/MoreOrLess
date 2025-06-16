'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createCounter, getUserCounters } from '@/lib/firebase';
import QuickCounter from '@/components/QuickCounter';
import '@/styles/home.css';
import Link from 'next/link';

interface CounterData {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState<CounterData[]>([]);

  useEffect(() => {
    if (user) {
      console.log('User is connected, fetching counters...');
      const fetchCounters = async () => {
        try {
          const userCounters = await getUserCounters(user.uid);
          console.log('Fetched counters:', userCounters);
          setCounters(userCounters);
        } catch (error) {
          console.error('Error fetching counters:', error);
        }
      };
      fetchCounters();
    } else {
      console.log('No user connected');
      setCounters([]);
    }
  }, [user]);

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const counterId = await createCounter(title, user?.uid);
      router.push(`/counter/${counterId}`);
    } catch (error) {
      console.error('Error creating counter:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-container">
      <h1 className="home-title">Plus ou Moins</h1>

      {user ? (
        <div className="user-section">
    
          <h2>Bienvenue, {user.displayName || user.email}</h2>
        </div>
      ) : (
        <div className="cta-section">
          <p>Connectez-vous pour commencer à créer vos compteurs</p>
        </div>
      )}

      <div className="quick-counter-section">
        <p className="section-description">
          Ce compteur est temporaire et ne sera pas enregistré.
        </p>
        <QuickCounter />
      </div>

      {user && (
        <>
          {counters.length > 0 && (
            <div className="counters-list-section">
              <Link href="/dashboard" className="dashboard-link">
            <h2>Mes compteurs</h2>
             </Link>
              <div className="counters-list">
                {counters.map((counter) => (
                  <Link
                    key={counter.id}
                    href={`/counter/${counter.id}`}
                    className="counter-link"
                  >
                    {counter.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="create-counter-section">
            <h2 className="section-title">Créer un Compteur</h2>
            <p className="section-description">
              Créez un compteur personnalisé et partageable
            </p>
            
            <form onSubmit={handleCreateCounter} className="create-form">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nom du compteur"
                className="title-input"
                required
              />
              <button 
                type="submit" 
                className="create-button"
                disabled={loading || !title.trim()}
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
} 