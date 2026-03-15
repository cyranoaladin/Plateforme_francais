const PREFERRED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

export function pickSupportedAudioMimeType(
  isTypeSupported?: (mimeType: string) => boolean,
): string {
  if (!isTypeSupported) {
    return 'audio/webm';
  }

  for (const mimeType of PREFERRED_AUDIO_MIME_TYPES) {
    if (isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return 'audio/webm';
}

export type RecordedAudio = {
  blob: Blob;
  mimeType: string;
};

type MediaRecorderCtor = {
  new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
  isTypeSupported?: (mimeType: string) => boolean;
};

export type BrowserAudioRecorder = {
  start: () => Promise<void>;
  stop: () => Promise<RecordedAudio>;
};

export function createAudioRecorder(deps: {
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>;
  MediaRecorderCtor?: MediaRecorderCtor;
}): BrowserAudioRecorder | null {
  const { mediaDevices, MediaRecorderCtor } = deps;
  if (!mediaDevices?.getUserMedia || !MediaRecorderCtor) {
    return null;
  }

  const mimeType = pickSupportedAudioMimeType(MediaRecorderCtor.isTypeSupported);
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: BlobPart[] = [];

  return {
    async start() {
      stream = await mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorderCtor(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.start();
    },
    async stop() {
      if (!recorder || recorder.state === 'inactive') {
        throw new Error('Aucun enregistrement audio en cours.');
      }

      return await new Promise<RecordedAudio>((resolve, reject) => {
        recorder!.onstop = () => {
          const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
          stream?.getTracks().forEach((track) => track.stop());
          recorder = null;
          stream = null;
          resolve({
            blob: audioBlob,
            mimeType: audioBlob.type || mimeType || 'audio/webm',
          });
        };
        recorder!.onerror = () => {
          stream?.getTracks().forEach((track) => track.stop());
          recorder = null;
          stream = null;
          reject(new Error('Erreur lors de l enregistrement audio.'));
        };
        recorder!.stop();
      });
    },
  };
}
