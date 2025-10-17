import { useEffect, useRef, useMemo } from "react";

type SoundMap = {
  [key: string]: string;
};

export function useSoundPlayer(sounds: SoundMap) {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    audioRefs.current = Object.fromEntries(
      Object.entries(sounds).map(([name, path]) => [name, new Audio(path)])
    );
    const unlock = () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.play().catch(() => {});
        audio.pause();
        audio.currentTime = 0;
      });

      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };

    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, [sounds]);

  const playFns = useMemo(() => {
    const fns: Record<string, () => void> = {};
    Object.keys(sounds).forEach((name) => {
      fns[`${name}SoundPlay`] = () => {
        const audio = audioRefs.current[name];
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch((err) => {
            console.warn(`Failed to play sound "${name}":`, err);
          });
        }
      };
    });
    return fns;
  }, [sounds]);

  return playFns as {
    [K in keyof typeof sounds as `${K & string}SoundPlay`]: () => void;
  };
}
