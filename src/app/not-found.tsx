'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { updateCounterName } from '@/lib/firebase';
import Counter from '@/components/Counter';
import Loader from '@/components/Loader';
import '@/styles/counter.css';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

export default function NotFound() {
  const { user } = useAuth();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterName, setCounterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the current path matches a counter route
    const path = window.location.pathname;
    const counterMatch = path.match(/\/counter\/([^\/]+)/);
    
    if (counterMatch) {
      const id = counterMatch[1];
      setCounterId(id);
      fetchCounter(id);
    } else {
      setLoading(false);
      setError('Page non trouvée');
    }
  }, []);

  const fetchCounter = async (id: string) => {
    try {
      const counterRef = doc(db, 'counters', id);
      const counterDoc = await getDoc(counterRef);

      if (counterDoc.exists()) {
        const data = counterDoc.data();
        setCounterName(data.name);
        setNewName(data.name);
        setIsOwner(user?.uid === data.userId);
        setError(null);
      } else {
        setError('Compteur non trouvé');
      }
    } catch (error) {
      console.error('Error fetching counter:', error);
      setError('Erreur lors du chargement du compteur');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !newName.trim() || newName === counterName || !counterId) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateCounterName(counterId, newName.trim());
      setCounterName(newName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating counter name:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error && !counterId) {
    return (
      <div className="error-container">
        <h2 className="error-title">Page non trouvée</h2>
        <p className="error-message">{error}</p>
        <Link href="/" className="error-link">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (counterId) {
    return (
      <div className="counter-page-container">
        <Breadcrumb 
          items={[
            { label: 'Compteur', href: `/counter/${counterId}` }
          ]} 
        />
        <div className="counter-page-content">
          <Counter 
            counterId={counterId} 
            isOwner={isOwner} 
            title={counterName}
            onRename={() => setIsEditing(true)}
            isEditing={isEditing}
            newName={newName}
            setNewName={setNewName}
            handleRename={handleRename}
            isUpdating={isUpdating}
            onCancelRename={() => {
              setNewName(counterName);
              setIsEditing(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="error-container">
      <h2 className="error-title">Page non trouvée</h2>
      <p className="error-message">La page que vous recherchez n'existe pas.</p>
      <Link href="/" className="error-link">
        Retour à l'accueil
      </Link>
    </div>
  );
} 