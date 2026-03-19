type RemoteAudioLike = {
  preload?: string;
  play: () => Promise<unknown> | unknown;
};

export function createRemoteAudioPlayer(
  audioFactory: (url: string) => RemoteAudioLike = (url) => new Audio(url),
) {
  return async (url: string) => {
    const audio = audioFactory(url);
    audio.preload = 'auto';
    await Promise.resolve(audio.play());
    return audio;
  };
}
