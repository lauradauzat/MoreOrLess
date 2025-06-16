'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import CounterGraph from './CounterGraph';
import '@/styles/counter.css';
import { 
  PencilIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  ShareIcon,
  ChartBarIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

interface CounterAction {
  type: 'increment' | 'decrement' | 'reset';
  userId: string;
  userName: string;
  timestamp: Timestamp;
  isAnonymous?: boolean;
}

interface CounterProps {
  counterId: string;
  isOwner?: boolean;
  title?: string;
  initialValue?: number;
  onRename?: () => void;
  isEditing?: boolean;
  newName?: string;
  setNewName?: (name: string) => void;
  handleRename?: (e: React.FormEvent) => Promise<void>;
  isUpdating?: boolean;
  onCancelRename?: () => void;
  allowNegative?: boolean;
  alertThreshold?: number;
}

export default function Counter({ 
  counterId, 
  isOwner = false, 
  title = 'Mon Compteur', 
  initialValue = 0, 
  onRename,
  isEditing = false,
  newName = '',
  setNewName,
  handleRename,
  isUpdating = false,
  onCancelRename,
  allowNegative = false,
  alertThreshold = 0
}: CounterProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<'increment' | 'decrement' | 'reset' | null>(null);
  const [recentActions, setRecentActions] = useState<CounterAction[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [settings, setSettings] = useState({
    allowNegative,
    alertThreshold
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockValue, setBlockValue] = useState<number | ''>('');

  const exportToCSV = () => {
    if (!isOwner) return;

    // Créer l'en-tête du CSV
    const headers = [
      '#',
      'Occupation',
      'Entrées totales',
      'Sorties totales',
      'Changement total des entrées',
      'Date',
      ...Array.from(new Set(recentActions.map(action => action.userName)))
        .flatMap(userName => [`${userName} Entries`, `${userName} Exits`])
    ];
    const rows = [headers];

    // Trier les actions par date (du plus récent au plus ancien)
    const sortedActions = [...recentActions].sort((a, b) => 
      b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
    );

    // Fonction pour arrondir à l'intervalle de 15 minutes
    const roundTo15Minutes = (date: Date) => {
      const minutes = date.getMinutes();
      const roundedMinutes = Math.floor(minutes / 15) * 15;
      const roundedDate = new Date(date);
      roundedDate.setMinutes(roundedMinutes, 0, 0);
      return roundedDate;
    };

    // Grouper les actions par intervalle de 15 minutes
    const groupedActions = new Map<string, CounterAction[]>();
    sortedActions.forEach(action => {
      const roundedDate = roundTo15Minutes(action.timestamp.toDate());
      const key = roundedDate.toISOString();
      if (!groupedActions.has(key)) {
        groupedActions.set(key, []);
      }
      groupedActions.get(key)!.push(action);
    });

    // Créer un objet pour suivre les entrées/sorties par utilisateur
    const userStats = new Map();
    let totalEntries = 0;
    let totalExits = 0;
    let totalChanges = 0;
    let occupation = 0;

    // Traiter chaque groupe d'actions
    let index = 1;
    Array.from(groupedActions.entries()).forEach(([dateKey, actions]) => {
      const date = new Date(dateKey);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      // Traiter toutes les actions de cet intervalle
      actions.forEach((action: CounterAction) => {
        // Initialiser les stats de l'utilisateur si nécessaire
        if (!userStats.has(action.userName)) {
          userStats.set(action.userName, { entries: 0, exits: 0 });
        }
        const userStat = userStats.get(action.userName);

        // Mettre à jour les stats selon le type d'action
        if (action.type === 'increment') {
          userStat.entries++;
          totalEntries++;
          totalChanges++;
          occupation++;
        } else if (action.type === 'decrement') {
          userStat.exits++;
          totalExits++;
          totalChanges--;
          occupation--;
        } else if (action.type === 'reset') {
          // Pour un reset, on considère que tous les utilisateurs sortent
          userStats.forEach(stat => {
            stat.exits += stat.entries;
            stat.entries = 0;
          });
          totalExits += totalEntries;
          totalEntries = 0;
          totalChanges = 0;
          occupation = 0;
        }
      });

      // Créer la ligne pour cet intervalle
      const row = [
        index,
        occupation,
        totalEntries,
        totalExits,
        totalChanges,
        formattedDate,
        ...Array.from(userStats.keys()).flatMap(userName => {
          const stats = userStats.get(userName);
          return [stats.entries, stats.exits];
        })
      ];

      rows.push(row);
      index++;
    });

    // Convertir en CSV avec des guillemets pour chaque valeur
    const csvContent = rows.map(row => 
      row.map(value => `"${value}"`).join(',')
    ).join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timeline-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const counterRef = doc(db, 'counters', counterId);
    
    const unsubscribe = onSnapshot(counterRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCount(data.value);
        setRecentActions(data.recentActions || []);
        setSettings({
          allowNegative: data.allowNegative || false,
          alertThreshold: data.alertThreshold || 0
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [counterId]);

  const updateCounter = async (type: 'increment' | 'decrement' | 'reset') => {
    if (isBlocked && blockValue !== '') {
      const newValue = type === 'increment' ? count + 1 : type === 'decrement' ? count - 1 : 0;
      if (type === 'increment' && newValue > blockValue) return;
    }

    const newValue = type === 'increment' ? count + 1 : type === 'decrement' ? count - 1 : 0;
    if (!allowNegative && newValue < 0) return;

    try {
      const counterRef = doc(db, 'counters', counterId);
      const timestamp = new Date();
      
      // Déterminer les informations de l'utilisateur
      let userName = 'Visiteur';
      let userId = 'anonymous';
      let isAnonymous = true;

      if (user) {
        userName = user.displayName || user.email || 'Utilisateur';
        userId = user.uid;
        isAnonymous = user.isAnonymous;
      }

      const newAction = {
        type,
        userId,
        userName,
        isAnonymous,
        timestamp: Timestamp.fromDate(timestamp)
      };

      // Mettre à jour l'état local immédiatement
      setCount(newValue);
      setLastAction(type);
      setRecentActions(prevActions => [newAction, ...prevActions.slice(0, 49)]);

      // Mettre à jour Firestore
      await updateDoc(counterRef, {
        value: newValue,
        lastUpdated: timestamp,
        recentActions: [newAction, ...recentActions.slice(0, 49)]
      });
    } catch (error) {
      console.error('Error updating counter:', error);
      // En cas d'erreur, restaurer l'état précédent
      setCount(count);
      setLastAction(null);
      setRecentActions(recentActions);
    }
  };

  const updateSettings = async (newSettings: { allowNegative: boolean; alertThreshold: number }) => {
    const counterRef = doc(db, 'counters', counterId);
    await updateDoc(counterRef, {
      allowNegative: newSettings.allowNegative,
      alertThreshold: newSettings.alertThreshold,
      lastUpdated: Timestamp.now()
    });
    setSettings(newSettings);
    setIsEditingSettings(false);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    try {
      await deleteDoc(doc(db, 'counters', counterId));
      router.push('/');
    } catch (error) {
      console.error('Error deleting counter:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/counter/${counterId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="counter-container" role="region" aria-label="Compteur">
      <div className="text-center mb-8">
        {isEditing ? (
          <form onSubmit={handleRename} className="rename-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName?.(e.target.value)}
              className="rename-input"
              placeholder="Nouveau nom"
              autoFocus
            />
            <div className="rename-buttons">
              <button
                type="submit"
                className="rename-button save"
                disabled={isUpdating || !newName.trim() || newName === title}
              >
                {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                className="rename-button cancel"
                onClick={onCancelRename}
                disabled={isUpdating}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="counter-header">
            <h1 className="counter-title">{title}</h1>
            <p className="counter-subtitle">
              {isOwner ? 'Vous êtes le propriétaire de ce compteur' : 'Compteur partagé'}
            </p>
          </div>
        )}
      </div>
      
      <div 
        className={`counter-value ${lastAction ? `last-action-${lastAction}` : ''} ${settings.alertThreshold > 0 && count >= settings.alertThreshold ? 'alert-threshold' : ''}`}
        role="status" 
        aria-live="polite"
      >
        {count}
        {settings.alertThreshold > 0 && count >= settings.alertThreshold && (
          <div className="alert-indicator" role="alert">
            Seuil d'alerte atteint !
          </div>
        )}
      </div>

      <div className="counter-controls">
        <div className="counter-buttons">
          <button
            className="counter-button decrement-button tooltip"
            onClick={() => updateCounter('decrement')}
            aria-label="Diminuer la valeur"
            disabled={!allowNegative && count <= 0}
          >
            -
            <span className="tooltip-text">Diminuer la valeur</span>
          </button>
          
          <button
            className="counter-button increment-button tooltip"
            onClick={() => updateCounter('increment')}
            aria-label="Augmenter la valeur"
            disabled={isBlocked && blockValue !== '' && count >= blockValue}
          >
            +
            <span className="tooltip-text">Augmenter la valeur</span>
          </button>
        </div>
      </div>

      <div className="graph-toggle">
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="toggle-button"
          aria-expanded={showGraph}
        >
          <ChartBarIcon className="button-icon" />
          {showGraph ? 'Masquer le graphique' : 'Afficher le graphique'}
        </button>
      </div>

      {showGraph && (
        <div className="graph-section">
          <div className="graph-container">
            <div className="graph-header">
              <h3>Évolution de l'occupation</h3>
            </div>
            <CounterGraph 
              actions={recentActions} 
              initialValue={initialValue}
              alertThreshold={settings.alertThreshold}
              counterId={counterId}
            />
          </div>
        </div>
      )}

      {recentActions.length > 0 && (
        <div className="recent-actions">
          <h3 className="recent-actions-title">Dernières modifications</h3>
          <ul className="recent-actions-list">
            {recentActions.slice(-5).reverse().map((action, index) => (
              <li key={index} className="recent-action-item">
                <span className="action-user">
                  {action.userName}
                  {action.isAnonymous && ' (Visiteur)'}
                </span>
                <span className="action-type">
                  {action.type === 'increment' ? '➕' : action.type === 'decrement' ? '➖' : '🔄'}
                </span>
                <span className="action-time">
                  {new Date(action.timestamp.toDate()).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tools-container">
        <div className="tools-buttons">
          {isOwner && (
            <>
              <button
                onClick={onRename}
                className="action-button rename"
              >
                <PencilIcon className="button-icon" />
                Renommer
              </button>
              <button
                onClick={() => setShowConfirmReset(true)}
                className="action-button reset"
              >
                <ArrowPathIcon className="button-icon" />
                Réinitialiser
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="action-button delete"
              >
                <TrashIcon className="button-icon" />
                Supprimer
              </button>
              <button
                onClick={exportToCSV}
                className="action-button export"
              >
                <ArrowDownTrayIcon className="button-icon" />
                Exporter CSV
              </button>
            </>
          )}
          <button
            onClick={handleShare}
            className="action-button share"
          >
            <ShareIcon className="button-icon" />
            {copied ? 'Lien copié !' : 'Partager'}
          </button>
        </div>
        {copied && (
          <div className="share-tooltip">
            Lien copié dans le presse-papiers !
          </div>
        )}
      </div>

      {isOwner ? (
        <div className="counter-settings">
          <h3>Paramètres du compteur</h3>
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
                <span>Bloquer le compteur</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
              {isBlocked && (
                <div className="threshold-input">
                  <input
                    type="number"
                    value={blockValue}
                    onChange={(e) => setBlockValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Valeur limite"
                    className="block-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="counter-settings">
          <p className="settings-info">
            {settings.allowNegative ? 'Les valeurs négatives sont autorisées' : 'Les valeurs négatives sont désactivées'}
            {settings.alertThreshold > 0 && ` • Seuil d'alerte : ${settings.alertThreshold}`}
            {isBlocked && blockValue !== '' && ` • Valeur bloquée à : ${blockValue}`}
          </p>
        </div>
      )}

      {showConfirmReset && (
        <div className="confirm-dialog">
          <p>Voulez-vous vraiment réinitialiser le compteur à zéro ?</p>
          <div className="confirm-buttons">
            <button onClick={() => setShowConfirmReset(false)}>Annuler</button>
            <button onClick={() => {
              updateCounter('reset');
              setShowConfirmReset(false);
            }}>Confirmer</button>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="confirm-dialog">
          <p>Voulez-vous vraiment supprimer ce compteur ? Cette action est irréversible.</p>
          <div className="confirm-buttons">
            <button onClick={() => setShowConfirmDelete(false)}>Annuler</button>
            <button onClick={handleDelete}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
} 