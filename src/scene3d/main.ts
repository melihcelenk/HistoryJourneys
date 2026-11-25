import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cinzel/latin-ext-700.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-ext-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-ext-400-italic.css';
import '@fontsource/amiri/arabic-700.css';
import { DEFAULT_SCRIPT } from './briefing/mapDefinition';
import { startScene } from './SceneApp';
import { SHOTS, isShotName } from './shots';
import './scene.css';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const root = document.getElementById('scene-root');

if (shot === 'list') {
  // The screenshot script asks which fixed cameras exist.
  Object.assign(window, { sceneShots: Object.keys(SHOTS) });
} else if (root) {
  void startScene(root, {
    shot: shot !== null && isShotName(shot) ? shot : null,
    time: Number(params.get('t') ?? 0) || 0,
    step: params.has('step') ? Number(params.get('step')) || 0 : null,
    script: params.get('script') === 'latin' ? 'latin' : DEFAULT_SCRIPT,
    quality: params.get('q') === 'low' ? 'low' : 'high',
    only: params.get('only'),
  });
}
