'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Fil d'Ariane">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link">
            <HomeIcon className="breadcrumb-icon" />
            <span className="breadcrumb-text">Accueil</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.href} className="breadcrumb-item">
            <ChevronRightIcon className="breadcrumb-separator" />
            <Link 
              href={item.href}
              className={`breadcrumb-link ${index === items.length - 1 ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
} 