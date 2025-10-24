import { Link } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageSquare, Wand, Bell, Bookmark } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LeftSidebar() {
  const { t, isRtl } = useTranslation();
  const location = useLocation();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/explore', label: t('explore'), icon: Search },
    { href: '/projects', label: t('projects'), icon: PlusSquare },
    { href: '/messages', label: t('messages'), icon: MessageSquare },
    { href: '/notifications', label: t('notifications'), icon: Bell },
    { href: '/bookmarks', label: t('bookmarks'), icon: Bookmark },
    { href: '/space-ai', label: t('spaceAI'), icon: () => (
      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 0.5C4.97458 0.5 0.5 4.97458 0.5 10.5C0.5 16.0254 4.97458 20.5 10.5 20.5C16.0254 20.5 20.5 16.0254 20.5 10.5C20.5 4.97458 16.0254 0.5 10.5 0.5ZM13.0085 18.9678C13.7475 13.5644 5.84237 10.2085 2.15424 12.1746C6.47288 8.89322 11.3678 2.70339 9.27966 0.879661C10.5203 1.77458 11.639 2.82542 12.8797 3.72034C14.5678 4.94068 16.3847 5.97119 18.0525 7.21186C20.0051 8.66271 20.0458 8.71695 20.2763 9.04237C20.2017 8.98136 20.1068 8.88644 20.0186 8.8661C19.9712 8.85254 14.9814 9.53729 13.0017 18.9678H13.0085Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  ];

  return (
    <aside className='hidden md:flex flex-col gap-4 p-4 w-80 border-r'>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors',
            location.pathname === item.href && 'bg-muted text-primary'
          )}
        >
          <item.icon className='h-5 w-5' />
          <span className='text-sm font-medium'>{item.label}</span>
        </Link>
      ))}
    </aside>
  );
}