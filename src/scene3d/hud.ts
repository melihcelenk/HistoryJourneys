/**
 * What is written over the scene while the player walks: where we are, how to move, the invitation to listen to
 * the figure and the credits of the models used. Plain DOM over the canvas.
 */
export interface Hud {
  /** Tells the HUD whether the player stands close enough to the figure to be invited. */
  setNear(near: boolean): void;
  /** Hides what belongs to walking (the hint and the invitation) while something else has the screen. */
  setWalking(walking: boolean): void;
  dispose(): void;
}

export interface HudOptions {
  /** Name of the figure and the address of his card in the game. */
  title: string;
  backHref: string;
  /** The words on the button that invites the player, and what happens when it is taken. */
  invitation: string;
  onInvite(): void;
}

const PLACE = 'Saray-ı Cedîd, İstanbul · 1470’ler';
const HINT_MOUSE = 'W A S D ile yürü · bakmak için sahneye tıkla, sonra fareyi hareket ettir · Esc fareyi bırakır';
const HINT_TOUCH = 'Sol tarafı sürükleyerek yürü · sağ tarafı sürükleyerek etrafa bak';
const INVITE_KEY = 'KeyE';

/** The models that were not made for this project, with their makers and licences. */
const CREDITS: readonly { what: string; who: string; licence: string; url: string }[] = [
  { what: 'Baş taraması', who: 'Lee Perry-Smith (Infinite-Realities)', licence: 'CC BY 3.0', url: 'https://ir-ltd.net' },
  { what: 'El modelleri', who: 'WebXR Input Profiles (Amazon)', licence: 'MIT', url: 'https://github.com/immersive-web/webxr-input-profiles' },
  { what: 'Üç boyutlu çizim', who: 'three.js', licence: 'MIT', url: 'https://threejs.org' },
];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, testId: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.dataset.testid = testId;
  node.textContent = text;
  return node;
}

function createCredits(): HTMLElement {
  const details = element('details', 'scene-credits', 'scene-credits');
  details.append(element('summary', 'scene-credits__summary', 'scene-credits-summary', 'Kaynaklar'));
  const list = element('ul', 'scene-credits__list', 'scene-credits-list');
  for (const credit of CREDITS) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = credit.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = credit.who;
    item.append(`${credit.what}: `, link, ` · ${credit.licence}`);
    list.append(item);
  }
  details.append(list);
  return details;
}

export function createHud(root: HTMLElement, options: HudOptions): Hud {
  const layer = element('div', 'scene-hud', 'scene-hud');
  const header = element('header', 'scene-hud__header', 'scene-header');
  const back = element('a', 'scene-hud__back', 'scene-back', '← Haritaya dön');
  back.href = options.backHref;
  header.append(back, element('h1', 'scene-hud__title', 'scene-title', options.title), element('p', 'scene-hud__place', 'scene-place', PLACE));

  const touch = window.matchMedia('(pointer: coarse)').matches;
  const hint = element('p', 'scene-hud__hint', 'scene-hint', touch ? HINT_TOUCH : HINT_MOUSE);
  const prompt = element('button', 'scene-hud__prompt', 'scene-prompt', touch ? options.invitation : `${options.invitation}  ·  E`);
  prompt.type = 'button';
  prompt.hidden = true;
  layer.append(header, hint, prompt, createCredits());
  root.append(layer);

  let near = false;
  let walking = true;
  const refresh = (): void => {
    hint.hidden = !walking;
    prompt.hidden = !(walking && near);
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.code === INVITE_KEY && !prompt.hidden) options.onInvite();
  };
  prompt.addEventListener('click', options.onInvite);
  window.addEventListener('keydown', onKey);

  return {
    setNear(next) {
      if (near === next) return;
      near = next;
      refresh();
    },
    setWalking(next) {
      walking = next;
      refresh();
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
      layer.remove();
    },
  };
}
