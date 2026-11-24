import { useState } from 'react';
import type { Action } from '../domain/types';
import { Icon, type IconName } from './Icon';
import { RichText } from './RichText';

type RevealKind = 'cause' | 'consequence' | 'depth';

const REVEALS: Record<RevealKind, { label: string; icon: IconName; title: string }> = {
  cause: { label: 'Neden', icon: 'cause', title: 'Neden oldu?' },
  consequence: { label: 'Sonuç', icon: 'consequence', title: 'Sonra ne değişti?' },
  depth: { label: 'Derinlik', icon: 'depth', title: 'Daha derine in' },
};

/** Buttons appear in the order the reveals are defined above. */
const REVEAL_ORDER = Object.keys(REVEALS) as RevealKind[];

interface ActionItemProps {
  action: Action;
}

/**
 * One thing a figure did, with buttons that reveal its cause and consequence
 * (FR-2) and, where the short statement simplifies, the fuller account behind
 * the depth marker (FR-27).
 */
export function ActionItem({ action }: ActionItemProps) {
  const [open, setOpen] = useState<RevealKind | null>(null);
  const texts: Record<RevealKind, string | undefined> = {
    cause: action.cause,
    consequence: action.consequence,
    depth: action.depth,
  };
  const available = REVEAL_ORDER.filter((kind) => texts[kind]);

  return (
    <li className="action" data-testid={`action-${action.id}`}>
      <div className="action__head">
        <span className="action__year">{action.year}</span>
        <p className="action__text">
          <RichText text={action.text} />
        </p>
      </div>
      <div className="action__buttons">
        {available.map((kind) => (
          <button
            key={kind}
            type="button"
            className="ink-btn"
            aria-expanded={open === kind}
            onClick={() => setOpen(open === kind ? null : kind)}
          >
            <Icon name={REVEALS[kind].icon} />
            {REVEALS[kind].label}
          </button>
        ))}
      </div>
      {available.map((kind) => (
        <div key={kind} className="reveal" data-open={open === kind} aria-hidden={open !== kind}>
          <div className="reveal__inner">
            <div className="reveal__body" data-tone={kind}>
              <span className="reveal__title">{REVEALS[kind].title}</span>
              {open === kind && <RichText text={texts[kind] ?? ''} />}
            </div>
          </div>
        </div>
      ))}
    </li>
  );
}
