import { Audio } from "expo-av";
import { useEffect, useMemo, useRef } from "react";

type Controls = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  unload: () => Promise<void>;
  restart: () => Promise<void>;
};

export default function useBackgroundMusic(
  asset: any,
  active: boolean,
  volume = 0.5,
): Controls {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(asset, {
          isLooping: true,
          volume,
        });
        soundRef.current = sound;
        if (active && mounted) {
          await sound.playAsync();
        }
      } catch (e) {
        console.warn("useBackgroundMusic error:", e);
      }
    }

    prepare();

    return () => {
      mounted = false;
      (async () => {
        try {
          await soundRef.current?.unloadAsync();
        } catch (e) {
          /* ignore */
        }
        soundRef.current = null;
      })();
    };
    // only recreate when asset changes, don't recreate for every volume change
  }, [asset]);

  // apply volume changes to the existing sound instance in real time
  useEffect(() => {
    (async () => {
      try {
        if (!soundRef.current) return;
        await soundRef.current.setStatusAsync({ volume });
      } catch (e) {
        // ignore
      }
    })();
  }, [volume]);

  useEffect(() => {
    (async () => {
      try {
        if (!soundRef.current) return;
        if (active) {
          // restart from the beginning whenever activated
          try {
            await soundRef.current.setPositionAsync(0);
          } catch (err) {
            // some platforms may not support setPositionAsync before load; ignore
          }
          await soundRef.current.playAsync();
        } else {
          await soundRef.current.pauseAsync();
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [active]);
  // Memoize the controls object so its identity is stable across renders.
  const controls = useMemo<Controls>(() => {
    return {
      play: async () => {
        try {
          await soundRef.current?.playAsync();
        } catch (e) {
          /* ignore */
        }
      },
      pause: async () => {
        try {
          await soundRef.current?.pauseAsync();
        } catch (e) {
          /* ignore */
        }
      },
      unload: async () => {
        try {
          await soundRef.current?.unloadAsync();
          soundRef.current = null;
        } catch (e) {
          /* ignore */
        }
      },
      restart: async () => {
        try {
          if (!soundRef.current) return;
          try {
            await soundRef.current.setPositionAsync(0);
          } catch (err) {
            /* ignore */
          }
          await soundRef.current.playAsync();
        } catch (e) {
          /* ignore */
        }
      },
    };
  }, []);

  return controls;
}
