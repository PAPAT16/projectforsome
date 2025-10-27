import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  adLayout?: string;
  adUnitId: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({
  adSlot,
  adFormat = 'auto',
  adLayout,
  adUnitId,
  className = '',
  style = {}
}: AdBannerProps) {
  const { user, profile } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  const isPremiumCustomer = profile?.role === 'customer' && checkPremiumStatus();

  function checkPremiumStatus(): boolean {
    return false;
  }

  useEffect(() => {
    if (isPremiumCustomer) {
      return;
    }

    const loadAds = () => {
      try {
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }
        if (adRef.current) {
          (window.adsbygoogle as any[]).push({});
        }
      } catch (err) {
        console.error('AdSense error:', err);
      }
    };

    const timer = setTimeout(loadAds, 300);

    return () => clearTimeout(timer);
  }, [isPremiumCustomer]);

  useEffect(() => {
    if (isPremiumCustomer || impressionTracked.current) {
      return;
    }

    const trackImpression = async () => {
      try {
        await supabase.rpc('track_ad_impression', {
          p_user_id: user?.id || null,
          p_ad_unit_id: adUnitId,
          p_ad_network: 'adsense',
          p_page_location: window.location.pathname,
          p_impression_type: 'view',
          p_estimated_revenue: 0
        });
        impressionTracked.current = true;
      } catch (err) {
        // Silently fail - ad tracking is not critical
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            trackImpression();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [user, adUnitId, isPremiumCustomer]);

  if (isPremiumCustomer) {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={`ad-container ${className}`}
      style={{
        minHeight: '90px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-full-width-responsive="true"
      />
    </div>
  );
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
