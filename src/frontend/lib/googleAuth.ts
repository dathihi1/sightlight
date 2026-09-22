/**
 * Helper tich hop Google Identity Services (GIS).
 *
 * Tai sao dung GIS thay vi OAuth redirect:
 * - GIS cung cap ID Token truc tiep trong callback (khong can server-side token exchange)
 * - Ho tro Sign In with Google button va One Tap prompt
 * - Tuong thich voi backend xac thuc qua /api/v1/auth/google (GoogleTokenVerifier)
 *
 * Tham khao: https://developers.google.com/identity/gsi/web/guides/overview
 */

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  client_id: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  locale?: string;
}

interface PromptMomentNotification {
  getMomentType: () => string;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

export function isGoogleAvailable(): boolean {
  return typeof window !== "undefined" && !!window.google?.accounts?.id;
}

function onGoogleReady(callback: () => void, maxAttempts = 40): void {
  if (isGoogleAvailable()) {
    callback();
    return;
  }
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (isGoogleAvailable()) {
      clearInterval(interval);
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
}

export function initializeGoogleSignIn(
  clientId: string,
  onCredentialResponse: (response: GoogleCredentialResponse) => void,
): void {
  onGoogleReady(() => {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: onCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  });
}

export function renderGoogleButton(
  elementId: string,
  options?: Partial<GoogleButtonConfig>,
): void {
  onGoogleReady(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    window.google!.accounts.id.renderButton(element, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      width: element.offsetWidth || 320,
      locale: "vi",
      ...options,
    });
  });
}
