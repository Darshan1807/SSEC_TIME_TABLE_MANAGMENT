/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService } from './storageService';

export interface OtpSessionState {
  email: string;
  role: 'student' | 'professor';
  purpose: 'REGISTRATION' | 'PASSWORD_RESET';
  recipientName?: string;
  identifier?: string;
  expiresAt: number;
  hashedCode: string;
  attempts: number;
  createdAt: number;
}

const OTP_ACTIVE_SESSION_KEY = 'ssec_otp_active_session_v2';

export class OtpService {
  /**
   * Generates a cryptographically secure SHA-256 hash using Web Crypto API
   */
  private static async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a 6-digit cryptographically random numeric string
   */
  private static generateSecureDigits(length: number = 6): string {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += (array[i] % 10).toString();
    }
    return code;
  }

  /**
   * Masks email address for privacy (e.g. 'darshanparmar1100@gmail.com' -> 'd*****************@gmail.com')
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const parts = email.split('@');
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2) {
      return `${user[0]}****@${domain}`;
    }
    return `${user[0]}${'*'.repeat(Math.max(user.length - 2, 3))}${user[user.length - 1]}@${domain}`;
  }

  /**
   * Retrieves the current unexpired local OTP session, if any
   */
  static getActiveSession(): OtpSessionState | null {
    try {
      const data = localStorage.getItem(OTP_ACTIVE_SESSION_KEY);
      if (!data) return null;
      const session: OtpSessionState = JSON.parse(data);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(OTP_ACTIVE_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Initiates OTP creation and dispatches email via the backend Gmail SMTP endpoint.
   * Securely hashes the OTP and sets a 5-minute expiry.
   */
  static async requestOtp(params: {
    email: string;
    role: 'student' | 'professor';
    purpose: 'REGISTRATION' | 'PASSWORD_RESET';
    recipientName?: string;
    identifier?: string;
  }): Promise<{ success: boolean; maskedEmail: string; expiresAt: number; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const expiryMinutes = 5;
    const now = Date.now();
    const expiresAt = now + expiryMinutes * 60 * 1000;

    // Generate 6-digit numeric OTP
    const rawOtp = this.generateSecureDigits(6);
    const hashedCode = await this.sha256(rawOtp);

    // Call backend Gmail SMTP dispatch FIRST
    try {
      const resp = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: params.purpose.toLowerCase(),
          recipient_name: params.recipientName,
          role: params.role,
          identifier: params.identifier,
          otp: rawOtp // Sent over secure POST directly to server-side Gmail SMTP
        })
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok || (json && json.success === false)) {
        // DO NOT wipe existing session on 429 cooldown so user can still verify their code!
        return {
          success: false,
          maskedEmail: this.maskEmail(cleanEmail),
          expiresAt: 0,
          error: (json && json.error) || 'Failed to dispatch verification email via Gmail SMTP.'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        maskedEmail: this.maskEmail(cleanEmail),
        expiresAt: 0,
        error: err.message || 'Unable to connect to verification email service.'
      };
    }

    // Save hashed session in local storage on successful dispatch (no plaintext OTP is stored)
    const session: OtpSessionState = {
      email: cleanEmail,
      role: params.role,
      purpose: params.purpose,
      recipientName: params.recipientName,
      identifier: params.identifier,
      expiresAt,
      hashedCode,
      attempts: 0,
      createdAt: now
    };

    try {
      localStorage.setItem(OTP_ACTIVE_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to store OTP session', e);
    }

    // Record in Security Audit logs (without OTP value)
    StorageService.addActivityLog({
      action_type: 'SECURITY',
      target_category: params.role === 'student' ? 'STUDENT' : 'PROFESSOR',
      target_name: `${params.recipientName || cleanEmail} (${params.identifier || 'Account'})`,
      target_id: cleanEmail,
      details: `Dispatched ${params.purpose === 'REGISTRATION' ? 'Registration' : 'Password Reset'} OTP to ${this.maskEmail(cleanEmail)} via Gmail SMTP.`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      maskedEmail: this.maskEmail(cleanEmail),
      expiresAt
    };
  }

  /**
   * Dual-layer verification:
   * 1. Checks backend /api/otp/verify (authoritative server-side verification).
   * 2. Falls back to local session SHA-256 hash if backend is unreachable or restarted.
   * Enforces 5-minute expiry and max 5 failed attempts.
   */
  static async verifyOtp(params: {
    email: string;
    purpose: 'REGISTRATION' | 'PASSWORD_RESET';
    code: string;
  }): Promise<{ valid: boolean; error?: string }> {
    const cleanCode = (params.code || '').trim().replace(/\D/g, '');

    if (!cleanCode || cleanCode.length !== 6) {
      return { valid: false, error: 'Please enter a valid 6-digit numeric OTP code.' };
    }

    // Get active local session (if any)
    const session = this.getActiveSession();
    const cleanEmail = (params.email || session?.email || '').trim().toLowerCase();
    const cleanPurpose = (params.purpose || session?.purpose || 'REGISTRATION').trim().toLowerCase();

    if (!cleanEmail) {
      return {
        valid: false,
        error: 'No active email address found for verification. Please request a new OTP.'
      };
    }

    let backendVerified = false;
    let backendError = '';

    // 1. Primary: Verify against backend server /api/otp/verify
    try {
      const resp = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: cleanPurpose,
          otp: cleanCode
        })
      });

      const json = await resp.json().catch(() => null);
      if (resp.ok && json && json.success) {
        backendVerified = true;
      } else if (json && json.error) {
        backendError = json.error;
      }
    } catch (err: any) {
      console.warn('[OTP] Backend verification call failed, trying local fallback...', err?.message);
    }

    if (backendVerified) {
      this.clearSession();
      return { valid: true };
    }

    // 2. Secondary: Fallback to local session hash verification
    if (session) {
      const sessionEmail = (session.email || '').trim().toLowerCase();
      const sessionPurpose = (session.purpose || '').trim().toLowerCase();

      if (sessionEmail === cleanEmail && sessionPurpose === cleanPurpose) {
        // Check expiration (5 minutes)
        if (Date.now() > session.expiresAt) {
          this.clearSession();
          return {
            valid: false,
            error: 'The OTP code has expired. Please click "Resend OTP" to request a fresh code.'
          };
        }

        // Check maximum failed attempts (5 max)
        if (session.attempts >= 5) {
          this.clearSession();
          return {
            valid: false,
            error: 'Too many incorrect attempts. For security, this OTP is now invalid. Please request a new OTP.'
          };
        }

        // Verify SHA-256 hash of the entered OTP
        const enteredHash = await this.sha256(cleanCode);
        if (enteredHash === session.hashedCode) {
          this.clearSession();
          return { valid: true };
        } else {
          session.attempts += 1;
          try {
            localStorage.setItem(OTP_ACTIVE_SESSION_KEY, JSON.stringify(session));
          } catch {}

          const remaining = 5 - session.attempts;
          if (remaining <= 0) {
            this.clearSession();
            return {
              valid: false,
              error: 'Too many incorrect attempts. OTP expired. Please request a new OTP.'
            };
          }
          return {
            valid: false,
            error: `Incorrect OTP code! You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          };
        }
      }
    }

    // 3. If backend gave a specific validation error (e.g. incorrect code, attempts remaining, expired)
    if (backendError && !backendError.includes('No active verification code')) {
      return {
        valid: false,
        error: backendError
      };
    }

    // 4. Default clear error message
    return {
      valid: false,
      error: `No active verification session found for ${this.maskEmail(cleanEmail)}. The verification code may have expired (5-minute limit) or already been verified. Please click "Resend Code" to receive a new one.`
    };
  }

  /**
   * Cleans up expired OTP session
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(OTP_ACTIVE_SESSION_KEY);
    } catch {}
  }
}
