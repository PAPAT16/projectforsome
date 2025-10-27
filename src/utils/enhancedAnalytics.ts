import { supabase } from '../lib/supabase';

let sessionId: string | null = null;
let sessionStartTime: number = Date.now();
let pagesViewed = 0;

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getSessionId(): string {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';

  if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';

  return browser;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1) return 'iOS';
  return 'Unknown';
}

export async function initializeSession(userId: string | undefined) {
  try {
    const sid = getSessionId();
    pagesViewed++;

    await supabase.from('analytics_user_sessions').insert({
      user_id: userId || null,
      session_id: sid,
      device_type: getDeviceType(),
      browser: getBrowserInfo(),
      os: getOS(),
      referrer: document.referrer || null,
      entry_page: window.location.pathname,
      pages_viewed: 1,
      duration_seconds: 0
    });
  } catch (err) {
    console.error('Error initializing session:', err);
  }
}

export async function trackPageView(userId: string | undefined, pagePath: string) {
  try {
    pagesViewed++;
    const sid = getSessionId();
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    await supabase
      .from('analytics_user_sessions')
      .update({
        exit_page: pagePath,
        pages_viewed: pagesViewed,
        duration_seconds: durationSeconds
      })
      .eq('session_id', sid);
  } catch (err) {
    console.error('Error tracking page view:', err);
  }
}

export async function trackSearchQuery(
  userId: string | undefined,
  searchQuery: string,
  filters: any,
  resultsCount: number,
  clickedTruckId?: string
) {
  try {
    await supabase.from('analytics_search_queries').insert({
      user_id: userId || null,
      search_query: searchQuery,
      filters_used: filters,
      results_count: resultsCount,
      clicked_truck_id: clickedTruckId || null,
      session_id: getSessionId()
    });
  } catch (err) {
    console.error('Error tracking search query:', err);
  }
}

export async function updateSessionLocation(lat: number, lng: number) {
  try {
    const sid = getSessionId();

    await supabase
      .from('analytics_user_sessions')
      .update({
        location_lat: lat,
        location_lng: lng
      })
      .eq('session_id', sid);
  } catch (err) {
    console.error('Error updating session location:', err);
  }
}

export async function trackUserInteraction(
  eventType: string,
  metadata: any
) {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      metadata: metadata,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error tracking user interaction:', err);
  }
}

export function endSession() {
  const sid = getSessionId();
  const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

  supabase
    .from('analytics_user_sessions')
    .update({
      duration_seconds: durationSeconds,
      pages_viewed: pagesViewed
    })
    .eq('session_id', sid)
    .then(() => {
      sessionId = null;
      sessionStartTime = Date.now();
      pagesViewed = 0;
    });
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', endSession);
}
