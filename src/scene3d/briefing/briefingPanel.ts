import type { Briefing } from './briefingSchema';

/**
 * The panel a briefing is read from: who is speaking, which step of how many, what he says, and the buttons to
 * go on, go back and leave. Plain DOM over the canvas; it knows nothing of the scene.
 */
export interface BriefingPanel {
  /** Shows a step of the briefing. */
  show(step: number): void;
  hide(): void;
  dispose(): void;
}

export interface BriefingPanelOptions {
  briefing: Briefing;
  /** Name of the figure and one line about him, shown above his words. */
  speaker: string;
  speakerNote: string;
  onForward(): void;
  onBack(): void;
  onClose(): void;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, testId: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.dataset.testid = testId;
  node.textContent = text;
  return node;
}

function button(className: string, testId: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = element('button', className, testId, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function createBriefingPanel(root: HTMLElement, options: BriefingPanelOptions): BriefingPanel {
  const { briefing } = options;
  const panel = element('section', 'briefing', 'briefing-panel');
  panel.hidden = true;
  panel.setAttribute('aria-live', 'polite');

  const head = element('header', 'briefing__head', 'briefing-head');
  const speaker = element('p', 'briefing__speaker', 'briefing-speaker', options.speaker);
  const note = element('p', 'briefing__note', 'briefing-note', options.speakerNote);
  const counter = element('p', 'briefing__counter', 'briefing-counter');
  const close = button('briefing__close', 'briefing-close', '×', options.onClose);
  close.setAttribute('aria-label', 'Anlatımı kapat');
  close.title = 'Anlatımı kapat (Esc)';
  head.append(speaker, note, counter, close);

  const title = element('h2', 'briefing__title', 'briefing-title');
  const text = element('p', 'briefing__text', 'briefing-text');
  const actions = element('div', 'briefing__actions', 'briefing-actions');
  const back = button('briefing__button', 'briefing-back', '← Geri', options.onBack);
  const forward = button('briefing__button briefing__button--main', 'briefing-next', '', options.onForward);
  actions.append(back, forward);
  panel.append(head, title, text, actions);
  root.append(panel);

  return {
    show(step) {
      const current = briefing.steps[step];
      if (!current) return;
      const last = step === briefing.steps.length - 1;
      counter.textContent = `${briefing.title} · ${step + 1} / ${briefing.steps.length}`;
      title.textContent = current.title;
      text.textContent = current.text;
      back.disabled = step === 0;
      forward.textContent = last ? 'Bitir' : 'İleri →';
      panel.dataset.step = current.id;
      panel.hidden = false;
    },
    hide() {
      panel.hidden = true;
    },
    dispose() {
      panel.remove();
    },
  };
}
