'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import '@/styles/dashboard-counter.css';

interface DashboardCounterProps {
  counterId: string;
  name: string;
}

export default function DashboardCounter({ counterId, name }: DashboardCounterProps) {
  const [count, setCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    allowNegative: false,
    alertThreshold: 0
  });
  const router = useRouter();

  useEffect(() => {
    const counterRef = doc(db, 'counters', counterId);
    const unsubscribe = onSnapshot(counterRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCount(data.value);
        setNewName(data.name);
        setSettings({
          allowNegative: data.allowNegative || false,
          alertThreshold: data.alertThreshold || 0
        });
      }
    });

    return () => unsubscribe();
  }, [counterId]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compteur ?')) {
      try {
        await deleteDoc(doc(db, 'counters', counterId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newName.trim() === '') return;

    try {
      await updateDoc(doc(db, 'counters', counterId), {
        name: newName.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(name);
    setIsEditing(false);
  };

  const handleCardClick = () => {
    if (!isEditing) {
      router.push(`/counter/${counterId}`);
    }
  };

  const updateSettings = async (newSettings: { allowNegative: boolean; alertThreshold: number }) => {
    try {
      await updateDoc(doc(db, 'counters', counterId), {
        allowNegative: newSettings.allowNegative,
        alertThreshold: newSettings.alertThreshold,
        lastUpdated: new Date()
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
    }
  };

  return (
    <div className="dashboard-counter" onClick={handleCardClick}>
      <div className="counter-header">
        {isEditing ? (
          <form onSubmit={handleSave} className="edit-form" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="edit-input"
              autoFocus
            />
            <div className="edit-actions">
              <button type="submit" className="action-icon save" title="Enregistrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
              </button>
              <button type="button" onClick={handleCancel} className="action-icon cancel" title="Annuler">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="counter-name">{name}</h3>
            <div className="counter-actions">
              <button
                onClick={handleEdit}
                className="action-icon edit"
                title="Modifier"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className={`action-icon settings ${showSettings ? 'active' : ''}`}
                title="Paramètres"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="action-icon delete"
                title="Supprimer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      <div className="counter-value">{count}</div>
      
      {showSettings && (
        <div className="counter-settings" onClick={e => e.stopPropagation()}>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="toggle-label">
                <span>Autoriser les valeurs négatives</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.allowNegative}
                    onChange={(e) => {
                      const newSettings = { ...settings, allowNegative: e.target.checked };
                      setSettings(newSettings);
                      updateSettings(newSettings);
                    }}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
            <div className="setting-item">
              <label className="toggle-label">
                <span>Activer le seuil d'alerte</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.alertThreshold > 0}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        alertThreshold: e.target.checked ? (settings.alertThreshold || 10) : 0
                      };
                      setSettings(newSettings);
                      updateSettings(newSettings);
                    }}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
              {settings.alertThreshold > 0 && (
                <div className="threshold-input">
                  <input
                    type="number"
                    value={settings.alertThreshold}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        alertThreshold: Math.max(0, Number(e.target.value))
                      };
                      setSettings(newSettings);
                      updateSettings(newSettings);
                    }}
                    min="1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 