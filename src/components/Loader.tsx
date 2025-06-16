'use client';

import '@/styles/loader.css';

export default function Loader() {
  return (
    <div className="loader-container">
      <div className="loader">
        <span className="loader-circle" />
        <span className="loader-circle" />
        <span className="loader-circle" />
      </div>
      <p className="loader-text">Encore quelques secondes...</p>
    </div>
  );
} 