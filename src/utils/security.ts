import { supabase } from '../lib/supabase';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function logSecurityEvent(
  userId: string | null,
  action: string,
  status: 'success' | 'failed' | 'blocked',
  details?: any
) {
  try {
    await supabase.from('security_audit_log').insert([
      {
        user_id: userId,
        action,
        status,
        ip_address: 'client-side',
        user_agent: navigator.userAgent,
        details,
      },
    ]);
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

export async function checkRateLimit(
  identifier: string,
  actionType: string,
  maxAttempts: number = MAX_LOGIN_ATTEMPTS
): Promise<{ allowed: boolean; remainingAttempts?: number; blockedUntil?: Date }> {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const { data: existing } = await supabase
      .from('rate_limit_tracking')
      .select('*')
      .eq('identifier', identifier)
      .eq('action_type', actionType)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (existing) {
      if (existing.blocked_until && new Date(existing.blocked_until) > new Date()) {
        return {
          allowed: false,
          blockedUntil: new Date(existing.blocked_until),
        };
      }

      if (existing.attempt_count >= maxAttempts) {
        const blockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await supabase
          .from('rate_limit_tracking')
          .update({
            blocked_until: blockedUntil.toISOString(),
            attempt_count: existing.attempt_count + 1,
          })
          .eq('id', existing.id);

        return {
          allowed: false,
          blockedUntil,
        };
      }

      await supabase
        .from('rate_limit_tracking')
        .update({
          attempt_count: existing.attempt_count + 1,
        })
        .eq('id', existing.id);

      return {
        allowed: true,
        remainingAttempts: maxAttempts - (existing.attempt_count + 1),
      };
    }

    await supabase.from('rate_limit_tracking').insert([
      {
        identifier,
        action_type: actionType,
        attempt_count: 1,
        window_start: new Date().toISOString(),
      },
    ]);

    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return { allowed: true };
  }
}

export async function resetRateLimit(identifier: string, actionType: string) {
  try {
    await supabase
      .from('rate_limit_tracking')
      .delete()
      .eq('identifier', identifier)
      .eq('action_type', actionType);
  } catch (err) {
    console.error('Failed to reset rate limit:', err);
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

export async function logChangelogEntry(
  changeType: 'api_key' | 'config' | 'feature' | 'security' | 'email',
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  requiresNotification: boolean = false,
  oldValue?: string,
  newValue?: string
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { data, error } = await supabase
      .from('system_changelog')
      .insert([
        {
          change_type: changeType,
          title,
          description,
          changed_by: userId,
          severity,
          requires_notification: requiresNotification,
          old_value: oldValue,
          new_value: newValue,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (requiresNotification && data) {
      await sendAdminNotification({
        changeType,
        title,
        description,
        severity,
        oldValue,
        newValue,
      });
    }

    return { success: true, data };
  } catch (err) {
    console.error('Failed to log changelog entry:', err);
    return { success: false, error: err };
  }
}

async function sendAdminNotification(payload: {
  changeType: string;
  title: string;
  description: string;
  severity: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-notification`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    await supabase
      .from('system_changelog')
      .update({ notification_sent: true })
      .eq('title', payload.title)
      .eq('created_at', new Date().toISOString());

    console.log('Admin notification sent successfully');
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }
}

export function detectSQLInjection(input: string): boolean {
  const sqlKeywords = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'EXEC',
    'UNION',
    '--',
    ';--',
    '/*',
    '*/',
  ];

  const upperInput = input.toUpperCase();
  return sqlKeywords.some((keyword) => upperInput.includes(keyword));
}

export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

export async function validateAndSanitizeUserInput(
  input: string,
  fieldName: string
): Promise<{ valid: boolean; sanitized: string; errors: string[] }> {
  const errors: string[] = [];

  if (detectSQLInjection(input)) {
    errors.push(`${fieldName} contains potentially malicious SQL patterns`);
    await logSecurityEvent(null, 'sql_injection_attempt', 'blocked', {
      field: fieldName,
      input: input.substring(0, 50),
    });
  }

  if (detectXSS(input)) {
    errors.push(`${fieldName} contains potentially malicious script patterns`);
    await logSecurityEvent(null, 'xss_attempt', 'blocked', {
      field: fieldName,
      input: input.substring(0, 50),
    });
  }

  const sanitized = sanitizeInput(input);

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}
