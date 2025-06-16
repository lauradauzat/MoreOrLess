'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CounterGraph from '@/components/CounterGraph';
import Loader from '@/components/Loader';
import '@/styles/counter.css';
import Breadcrumb from '@/components/Breadcrumb';

interface GraphPageProps {
  params: {
    id: string;
  };
}

export default function GraphPage({ params }: GraphPageProps) {
  const { id } = params;
  const [actions, setActions] = useState<any[]>([]);
  const [initialValue, setInitialValue] = useState(0);
  const [alertThreshold, setAlertThreshold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const counterRef = doc(db, 'counters', id);
    const unsubscribe = onSnapshot(counterRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setActions(data.recentActions || []);
        setInitialValue(data.initialValue || 0);
        setAlertThreshold(data.alertThreshold || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="counter-page-container">
      <Breadcrumb 
        items={[
          { label: 'Compteur', href: `/counter/${params.id}` },
          { label: 'Graphique', href: `/counter/${params.id}/graph` }
        ]} 
      />
      <div className="counter-page-content">
        <CounterGraph 
          actions={actions}
          initialValue={initialValue}
          alertThreshold={alertThreshold}
          isFullscreen={true}
          counterId={id}
        />
      </div>
    </div>
  );
} 