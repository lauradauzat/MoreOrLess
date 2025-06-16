'use client';

import { useState } from 'react';
import '@/styles/share.css';

interface ShareButtonProps {
  counterId: string;
}

export default function ShareButton({ counterId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/counter/${counterId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="share-container">
      <button
        onClick={copyToClipboard}
        className="share-button"
        aria-label="Copier le lien de partage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="share-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>{copied ? 'Lien copié !' : 'Partager'}</span>
      </button>
      {copied && (
        <div className="share-tooltip">
          Lien copié dans le presse-papiers !
        </div>
      )}
    </div>
  );
} 