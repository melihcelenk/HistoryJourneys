import { useEffect } from 'react';
import { openContentRepository } from './app/openDatabase';
import { toUrlState, useAppStore } from './app/store';
import { formatHash, parseHash } from './app/urlState';
import { GameScreen } from './ui/GameScreen';
import { Icon } from './ui/Icon';

/** SVG filter that gives parchment sheets their slightly rough, hand-cut edge. */
function TextureDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="rough-edge" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="8" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

function Splash({ failed }: { failed: boolean }) {
  return (
    <div className="splash" data-testid={failed ? 'load-error' : 'loading'} role={failed ? 'alert' : 'status'}>
      <Icon name="crest" className="splash__crest" />
      <h1 className="display splash__title">History Journeys</h1>
      {failed ? (
        <>
          <p>İçerik yüklenemedi. Bağlantını kontrol edip yeniden dene.</p>
          <button type="button" className="btn btn--wax btn--large" onClick={() => window.location.reload()}>
            Yeniden dene
          </button>
        </>
      ) : (
        <p>Haritalar açılıyor…</p>
      )}
    </div>
  );
}

/** Keeps the URL hash and the application state in step (NFR-3). */
function useUrlSync(): void {
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      if (state.status !== 'ready') return;
      const hash = formatHash(toUrlState(state));
      if (hash !== window.location.hash && !(hash === '#/' && window.location.hash === '')) {
        window.history.replaceState(null, '', hash);
      }
    });
    const onHashChange = (): void => useAppStore.getState().applyUrlState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);
}

export function App() {
  const status = useAppStore((state) => state.status);
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    // The effect can run twice (StrictMode, remount); a run that was cancelled gives its database back.
    let cancelled = false;
    openContentRepository()
      .then((repository) => {
        if (cancelled) repository.close();
        else void init(repository, parseHash(window.location.hash));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Content database could not be opened', error);
        useAppStore.getState().failToLoad();
      });
    return () => {
      cancelled = true;
    };
  }, [init]);

  useUrlSync();

  return (
    <>
      <TextureDefs />
      {status === 'ready' ? <GameScreen /> : <Splash failed={status === 'error'} />}
    </>
  );
}
