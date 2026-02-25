'use client';

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type BrowserStt = {
  start: () => void;
  stop: () => void;
  onResult: (cb: (text: string) => void) => void;
  onError: (cb: (error: string) => void) => void;
  onEnd: (cb: () => void) => void;
};

export function createBrowserStt(): BrowserStt | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) {
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = 'fr-FR';
  recognition.interimResults = true;
  recognition.continuous = true;

  let resultHandler: ((text: string) => void) | null = null;
  let errorHandler: ((error: string) => void) | null = null;
  let endHandler: (() => void) | null = null;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((item) => item[0]?.transcript ?? '')
      .join(' ')
      .trim();

    if (resultHandler) {
      resultHandler(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (errorHandler) {
      errorHandler(event.error);
    }
  };

  recognition.onend = () => {
    if (endHandler) {
      endHandler();
    }
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    onResult: (cb) => { resultHandler = cb; },
    onError: (cb) => { errorHandler = cb; },
    onEnd: (cb) => { endHandler = cb; },
  };
}
