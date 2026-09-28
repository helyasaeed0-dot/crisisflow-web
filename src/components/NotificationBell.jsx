import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function NotificationBell({ count = 0, to = '/notifications' }) {
  return (
    <Link
      to={to}
      className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-800"
      aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}