'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import DashboardCounter from '@/components/DashboardCounter';
import Loader from '@/components/Loader';
import '@/styles/dashboard.css';

interface CounterData {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [counters, setCounters] = useState<CounterData[]>([]);
  const [newCounterName, setNewCounterName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const countersRef = collection(db, 'counters');
    const q = query(countersRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const countersData: CounterData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        countersData.push({
          id: doc.id,
          name: data.name,
          value: data.value,
          createdAt: data.createdAt.toDate(),
        });
      });
      setCounters(countersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCounterName.trim()) return;

    try {
      await addDoc(collection(db, 'counters'), {
        name: newCounterName,
        value: 0,
        userId: user.uid,
        createdAt: new Date(),
      });
      setNewCounterName('');
    } catch (error) {
      console.error('Erreur lors de la création du compteur:', error);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Mes compteurs
        </h1>
        
        <form onSubmit={createCounter} className="create-counter-form">
          <input
            type="text"
            value={newCounterName}
            onChange={(e) => setNewCounterName(e.target.value)}
            placeholder="Nom du nouveau compteur"
            className="counter-input"
          />
          <button
            type="submit"
            className="create-button"
          >
            Créer
          </button>
        </form>
      </div>

      <div className="counters-grid">
        {counters.map((counter) => (
          <DashboardCounter
            key={counter.id}
            counterId={counter.id}
            name={counter.name}
          />
        ))}
      </div>
    </div>
  );
} 