import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: number;
  color_scheme: string;
  link_url: string | null;
  created_at: string;
}

export function AnnouncementTicker() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_announcements'
      }, fetchAnnouncements)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (announcements.length === 0 || isPaused || isDismissed) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused, isDismissed]);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('platform_announcements')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  const trackView = async (announcementId: string, clicked: boolean = false) => {
    if (!user) return;

    await supabase.from('announcement_views').insert({
      announcement_id: announcementId,
      user_id: user.id,
      clicked: clicked,
      viewed_at: new Date().toISOString()
    });
  };

  const handleClick = (announcement: Announcement) => {
    trackView(announcement.id, true);
    if (announcement.link_url) {
      window.open(announcement.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ticker_dismissed', Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('ticker_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('ticker_dismissed');
      }
    }
  }, []);

  useEffect(() => {
    if (announcements.length > 0 && user) {
      trackView(announcements[currentIndex].id);
    }
  }, [currentIndex, announcements, user]);

  if (announcements.length === 0 || isDismissed) return null;

  const currentAnnouncement = announcements[currentIndex];

  const getColorClasses = (scheme: string) => {
    switch (scheme) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'green':
        return 'bg-green-600 hover:bg-green-700';
      case 'orange':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'red':
        return 'bg-red-600 hover:bg-red-700';
      case 'yellow':
        return 'bg-yellow-500 hover:bg-yellow-600 text-gray-900';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div
      ref={tickerRef}
      className={`${getColorClasses(currentAnnouncement.color_scheme)} text-white transition-colors duration-300 relative overflow-hidden`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`
              text-xs font-bold px-2 py-0.5 rounded uppercase
              ${currentAnnouncement.color_scheme === 'yellow' ? 'bg-gray-900 text-yellow-400' : 'bg-white bg-opacity-20'}
            `}>
              {currentAnnouncement.category}
            </span>

            <button
              onClick={() => handleClick(currentAnnouncement)}
              className={`
                flex items-center gap-2 flex-1 text-left group
                ${currentAnnouncement.link_url ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className="font-semibold text-sm">
                {currentAnnouncement.title}
              </span>
              <span className="hidden md:inline text-sm opacity-90">
                {currentAnnouncement.message}
              </span>
              {currentAnnouncement.link_url && (
                <ExternalLink
                  size={14}
                  className="flex-shrink-0 opacity-75 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {announcements.length > 1 && (
              <div className="flex gap-1">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`
                      h-1.5 rounded-full transition-all
                      ${index === currentIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white bg-opacity-40 hover:bg-opacity-60'
                      }
                    `}
                    aria-label={`Go to announcement ${index + 1}`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleDismiss}
              className={`
                p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors flex-shrink-0
                ${currentAnnouncement.color_scheme === 'yellow' ? 'text-gray-900' : 'text-white'}
              `}
              aria-label="Dismiss announcements"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white bg-opacity-30">
        {!isPaused && (
          <div
            className="h-full bg-white transition-all duration-[5000ms] ease-linear"
            style={{
              width: '100%',
              animation: 'ticker-progress 5s linear infinite'
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes ticker-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
