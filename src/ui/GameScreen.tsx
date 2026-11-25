import { type Dialog, useAppStore } from '../app/store';
import { CommandBar } from './CommandBar';
import { ConceptDialog } from './dialogs/ConceptDialog';
import { FigurePickerDialog } from './dialogs/FigurePickerDialog';
import { AboutDialog, SettingsDialog } from './dialogs/InfoDialogs';
import { QuizDialog } from './dialogs/QuizDialog';
import { RelationGraphDialog } from './dialogs/RelationGraphDialog';
import { MapStage } from './MapStage';
import { RoutePanel } from './RoutePanel';
import { RouteHeader } from './RouteHeader';
import { TopBar } from './TopBar';
import { useUiSounds } from './useUiSounds';

function ActiveDialog({ dialog }: { dialog: Dialog }) {
  switch (dialog.kind) {
    case 'picker':
      return <FigurePickerDialog key={dialog.slot} slot={dialog.slot} />;
    case 'concept':
      return <ConceptDialog concept={dialog.concept} />;
    case 'relations':
      return <RelationGraphDialog key={dialog.figure} figure={dialog.figure} />;
    case 'quiz':
      return <QuizDialog />;
    case 'about':
      return <AboutDialog />;
    case 'settings':
      return <SettingsDialog />;
    default: {
      // A new kind of dialog must be handled here; the compiler reports it on this line.
      const unhandled: never = dialog;
      throw new Error(`Unhandled dialog: ${JSON.stringify(unhandled)}`);
    }
  }
}

/** The single screen of the game: the map as the stage, with panels over it (FR-29). */
export function GameScreen() {
  useUiSounds();
  const dialog = useAppStore((state) => state.dialog);
  return (
    <div className="game">
      <MapStage />
      <TopBar />
      <main className="panel">
        <RouteHeader />
        <div className="panel__scroll scroll">
          <RoutePanel />
        </div>
      </main>
      <CommandBar />
      {dialog && <ActiveDialog dialog={dialog} />}
    </div>
  );
}
