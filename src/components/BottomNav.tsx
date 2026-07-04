'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Compass, User, Calendar } from 'lucide-react';

const navItems = [
  { href: '/shows', label: 'Shows', icon: Tv },
  { href: '/upcoming', label: 'Upcoming', icon: Calendar },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
