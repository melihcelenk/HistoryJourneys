import { useMemo, useState } from 'react';
import { useAppStore, useRouteCards, useRouteFigureSlugs } from '../../app/store';
import { activeYear } from '../../domain/journey';
import {
  buildCauseQuestions,
  buildOrderingRound,
  type CauseQuestion,
  type OrderingRound,
  scoreOrdering,
} from '../../domain/quiz';
import type { FigureCard, FigureSummary } from '../../domain/types';
import { Icon } from '../Icon';
import { Medallion } from '../Medallion';
import { DialogShell } from './DialogShell';

type GameKind = 'ordering' | 'causes';

const CAUSE_QUESTION_COUNT = 5;
/** A route with fewer figures than this is too short for an ordering round; then every figure takes part. */
const MIN_ROUTE_FIGURES_FOR_ROUND = 4;

function OrderingGame({ figures }: { figures: FigureSummary[] }) {
  const bySlug = useMemo(() => new Map(figures.map((figure) => [figure.slug, figure])), [figures]);
  const [round, setRound] = useState<OrderingRound>(() => buildOrderingRound(figures, Math.random));
  const [order, setOrder] = useState<string[]>(round.shuffled);
  const [checked, setChecked] = useState(false);

  const move = (index: number, offset: number): void => {
    const target = index + offset;
    if (checked || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target] as string, next[index] as string];
    setOrder(next);
  };

  const restart = (): void => {
    const next = buildOrderingRound(figures, Math.random);
    setRound(next);
    setOrder(next.shuffled);
    setChecked(false);
  };

  return (
    <>
      <p className="quiz__question">Bu figürleri en eskiden en yeniye doğru sırala.</p>
      <ol className="order-list" data-testid="order-list">
        {order.map((slug, index) => {
          const figure = bySlug.get(slug);
          if (!figure) return null;
          const result = checked ? (round.solution[index] === slug ? 'right' : 'wrong') : undefined;
          return (
            <li key={slug} className="order-item" data-result={result} data-slug={slug}>
              <Medallion figure={figure} />
              <span className="order-item__name">{figure.nameTr}</span>
              {checked && <span className="order-item__year">{activeYear(figure)}</span>}
              <span className="order-item__moves">
                <button type="button" className="ink-btn" aria-label={`${figure.nameTr}: yukarı taşı`} disabled={checked || index === 0} onClick={() => move(index, -1)}>
                  <Icon name="up" />
                </button>
                <button type="button" className="ink-btn" aria-label={`${figure.nameTr}: aşağı taşı`} disabled={checked || index === order.length - 1} onClick={() => move(index, 1)}>
                  <Icon name="down" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="dialog__foot">
        {checked && (
          <span className="score" data-testid="score">
            {scoreOrdering(order, round.solution)} / {round.solution.length} doğru
          </span>
        )}
        {checked ? (
          <button type="button" className="btn btn--wax" data-testid="new-round" onClick={restart}>
            Yeni tur
          </button>
        ) : (
          <button type="button" className="btn btn--wax" data-testid="check-order" onClick={() => setChecked(true)}>
            <Icon name="check" />
            Kontrol et
          </button>
        )}
      </div>
    </>
  );
}

function CauseGame({ cards }: { cards: FigureCard[] }) {
  const [questions, setQuestions] = useState<CauseQuestion[]>(() =>
    buildCauseQuestions(cards, Math.random, CAUSE_QUESTION_COUNT),
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const question = questions[index];

  if (questions.length === 0) {
    return (
      <p data-testid="cause-empty">
        {cards.length === 0
          ? 'Bu oyun için önce bir yolculuk seç; sorular rotadaki kartlardan gelir.'
          : 'Bu rotadaki kartlardan yeterince farklı soru çıkmadı; daha uzun bir yolculuk dene.'}
      </p>
    );
  }

  const restart = (): void => {
    setQuestions(buildCauseQuestions(cards, Math.random, CAUSE_QUESTION_COUNT));
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (!question) {
    return (
      <>
        <p className="quiz__question" data-testid="cause-finished">
          Tur bitti: {questions.length} sorudan {score} doğru.
        </p>
        <div className="dialog__foot">
          <button type="button" className="btn btn--wax" onClick={restart}>
            Yeni tur
          </button>
        </div>
      </>
    );
  }

  const pick = (option: number): void => {
    if (picked !== null) return;
    setPicked(option);
    if (option === question.correctIndex) setScore(score + 1);
  };

  const resultOf = (option: number): 'right' | 'wrong' | undefined => {
    if (picked === null) return undefined;
    if (option === question.correctIndex) return 'right';
    return option === picked ? 'wrong' : undefined;
  };

  return (
    <>
      <p className="quiz__question">
        <strong>{question.figureName}:</strong> {question.action} <em>Neden?</em>
      </p>
      <ul className="quiz__options">
        {question.options.map((option, optionIndex) => (
          <li key={option}>
            <button
              type="button"
              className="quiz__option"
              data-testid={`cause-option-${optionIndex}`}
              data-result={resultOf(optionIndex)}
              disabled={picked !== null}
              onClick={() => pick(optionIndex)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      <div className="dialog__foot">
        <span className="score">
          Soru {index + 1} / {questions.length} · {score} doğru
        </span>
        <button
          type="button"
          className="btn btn--wax"
          data-testid="next-question"
          disabled={picked === null}
          onClick={() => {
            setIndex(index + 1);
            setPicked(null);
          }}
        >
          Devam
        </button>
      </div>
    </>
  );
}

/** Learning games built from the same data as the cards (FR-21). Scores are not stored (D6). */
export function QuizDialog() {
  const world = useAppStore((state) => state.world);
  const routeSlugs = useRouteFigureSlugs();
  const routeCards = useRouteCards();
  const [game, setGame] = useState<GameKind>('ordering');

  const figures = useMemo(() => {
    const slugs = new Set(routeSlugs);
    const all = world?.figures ?? [];
    const onRoute = all.filter((figure) => slugs.has(figure.slug));
    return onRoute.length >= MIN_ROUTE_FIGURES_FOR_ROUND ? onRoute : all;
  }, [world, routeSlugs]);

  return (
    <DialogShell title="Oyun" testId="quiz-dialog">
      <div className="game-tabs" role="tablist">
        <button type="button" role="tab" className="ink-btn" aria-selected={game === 'ordering'} onClick={() => setGame('ordering')}>
          Sıraya diz
        </button>
        <button type="button" role="tab" className="ink-btn" data-testid="tab-causes" aria-selected={game === 'causes'} onClick={() => setGame('causes')}>
          Neden oldu?
        </button>
      </div>
      {/* A new round is set up whenever the figures or the loaded cards change. */}
      {game === 'ordering' ? (
        <OrderingGame key={figures.map((figure) => figure.slug).join(',')} figures={figures} />
      ) : (
        <CauseGame key={routeCards.map((card) => card.slug).join(',')} cards={routeCards} />
      )}
    </DialogShell>
  );
}
