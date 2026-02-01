import { Link } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageCircle, Wand, Bell, Bookmark, Stars, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LeftSidebar() {
  const { t, isRtl } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/explore', label: t('explore'), icon: Search },
    {
      href: '/space-ai', label: t('space'), icon: () => (
        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 0.5C4.97458 0.5 0.5 4.97458 0.5 10.5C0.5 16.0254 4.97458 20.5 10.5 20.5C16.0254 20.5 20.5 16.0254 20.5 10.5C20.5 4.97458 16.0254 0.5 10.5 0.5ZM13.0085 18.9678C13.7475 13.5644 5.84237 10.2085 2.15424 12.1746C6.47288 8.89322 11.3678 2.70339 9.27966 0.879661C10.5203 1.77458 11.639 2.82542 12.8797 3.72034C14.5678 4.94068 16.3847 5.97119 18.0525 7.21186C20.0051 8.66271 20.0458 8.71695 20.2763 9.04237C20.2017 8.98136 20.1068 8.88644 20.0186 8.8661C19.9712 8.85254 14.9814 9.53729 13.0017 18.9678H13.0085Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    { href: '/projects', label: t('stars'), icon: Stars },
    {
      href: '/reels', label: t('Meteorites'), icon: () => (
        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.0334 8.3853C13.4045 9.64265 14.2638 11.4497 14.2638 13.4526C14.2638 17.2499 11.1804 20.3333 7.38312 20.3333C3.58579 20.3333 0.502441 17.2499 0.502441 13.4526C0.502441 9.65528 3.58579 6.57193 7.38312 6.57193C8.02759 6.57193 8.65311 6.66039 9.24703 6.83098" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M5.81609 13.5474C6.6815 13.5474 7.38304 12.8458 7.38304 11.9804C7.38304 11.115 6.6815 10.4135 5.81609 10.4135C4.95069 10.4135 4.24915 11.115 4.24915 11.9804C4.24915 12.8458 4.95069 13.5474 5.81609 13.5474Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M4.88105 6.17387C8.16659 4.5627 11.4521 2.95152 14.7314 1.34666L13.0001 5.2198L20.5 0.5L15.458 8.5243L18.5603 7.63973L13.0759 17.3194C12.7221 17.8186 11.3005 19.7141 8.74788 20.2132C5.93622 20.7629 2.97291 19.3792 1.4881 16.9087C0.180205 14.7289 0.173887 11.9678 1.45019 9.68687C1.7977 9.06136 2.35372 8.23365 3.20669 7.42491C3.80062 6.86889 4.38822 6.46452 4.87473 6.17387H4.88105Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M7.02929 17.3573C7.45152 17.3573 7.79381 17.0151 7.79381 16.5928C7.79381 16.1706 7.45152 15.8283 7.02929 15.8283C6.60706 15.8283 6.26477 16.1706 6.26477 16.5928C6.26477 17.0151 6.60706 17.3573 7.02929 17.3573Z" fill="white" />
          <path d="M10.5044 15.7462C10.9266 15.7462 11.2689 15.4039 11.2689 14.9817C11.2689 14.5594 10.9266 14.2171 10.5044 14.2171C10.0822 14.2171 9.73987 14.5594 9.73987 14.9817C9.73987 15.4039 10.0822 15.7462 10.5044 15.7462Z" fill="white" />
          <path d="M9.24708 6.83099C9.09544 7.07109 9.01331 7.35542 9.01331 7.66501C9.01331 8.54326 9.72728 9.25724 10.6055 9.25724C11.231 9.25724 11.7681 8.90341 12.0335 8.38531" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
        </svg>)
    },
    ...(user ? [
      { href: '/messages', label: t('messages'), icon: MessageCircle },
      { href: '/notifications', label: t('notifications'), icon: Bell },
      { href: '/bookmarks', label: t('bookmarks'), icon: Bookmark },
      { href: '/edit-profile', label: t('settings'), icon: Settings },
    ] : [])
  ];

  return (
    <aside className='hidden md:flex flex-col gap-4 p-4 w-80 border-r'>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg hover:bg-primary/30 dark:hover:bg-purple-500/30 transition-colors hover:no-underline',
            location.pathname === item.href && 'bg-primary/30 dark:bg-purple-500/30 text-primary'
          )}
        >
          <item.icon className='h-5 w-5' />
          <span className='text-sm font-medium'>{item.label}</span>
        </Link>
      ))}
    </aside>
  );
}