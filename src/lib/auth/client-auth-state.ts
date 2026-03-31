'use client';

const AUTH_EVENT = 'eaf:client-auth-state';

declare global {
  interface Window {
    __EAF_AUTHENTICATED__?: boolean;
  }
}

export function isClientAuthenticated() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.__EAF_AUTHENTICATED__ === true;
}

export function setClientAuthenticated(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.__EAF_AUTHENTICATED__ = value;
  window.dispatchEvent(new CustomEvent<boolean>(AUTH_EVENT, { detail: value }));
}

export function subscribeClientAuthenticated(listener: (value: boolean) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<boolean>).detail;
    listener(detail === true);
  };

  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
}
