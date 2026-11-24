import { type Dialog, useAppStore } from '../app/store';
import { CommandBar } from './CommandBar';
import { ConceptDialog } from './dialogs/ConceptDialog';
import { FigurePickerDialog } from './dialogs/FigurePickerDialog';
import { AboutDialog, SettingsDialog } from './dialogs/InfoDialogs';
import { QuizDialog } from './dialogs/QuizDialog';
import { MapStage } from './MapStage';
import { RoutePanel } from './RoutePanel';
import { RouteTabs } from './RouteTabs';
import { TopBar } from './TopBar';

function ActiveDialog({ dialog }: { dialog: Dialog }) {
  switch (dialog.kind) {
    case 'picker':
      return <FigurePickerDialog key={dialog.slot} slot={dialog.slot} />;
    case 'concept':
      return <ConceptDialog concept={dialog.concept} />;
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
  const dialog = useAppStore((state) => state.dialog);
  return (
    <div className="game">
      <MapStage />
      <TopBar />
      <main className="panel">
        <RouteTabs />
        <div className="panel__scroll scroll">
          <RoutePanel />
        </div>
      </main>
      <CommandBar />
      {dialog && <ActiveDialog dialog={dialog} />}
    </div>
  );
}
