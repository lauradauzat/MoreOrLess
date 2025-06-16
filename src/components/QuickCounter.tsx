'use client';

import { useState } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import '@/styles/quick-counter.css';

export default function QuickCounter() {
  const [count, setCount] = useState(0);
  const [lastAction, setLastAction] = useState<'increment' | 'decrement' | null>(null);

  const updateCounter = (type: 'increment' | 'decrement') => {
    setLastAction(type);
    setCount(prev => type === 'increment' ? prev + 1 : prev - 1);
  };

  return (
    <div className="quick-counter-container">
      <div 
        className={`quick-counter-value ${lastAction ? `last-action-${lastAction}` : ''}`}
        role="status" 
        aria-live="polite"
      >
        {count}
      </div>

      <div className="quick-counter-buttons">
        <button
          className="quick-counter-button decrement-button tooltip"
          onClick={() => updateCounter('decrement')}
          aria-label="Diminuer la valeur"
        >
          <MinusIcon className="button-icon" />
          <span className="tooltip-text">Diminuer la valeur</span>
        </button>
        
        <button
          className="quick-counter-button increment-button tooltip"
          onClick={() => updateCounter('increment')}
          aria-label="Augmenter la valeur"
        >
          <PlusIcon className="button-icon" />
          <span className="tooltip-text">Augmenter la valeur</span>
        </button>
      </div>
    </div>
  );
} 