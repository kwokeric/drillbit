import { useRoute } from './app/nav';
import type { DeckId } from './content/schema';
import { Cram } from './screens/Cram';
import { DeckDetail, Decks } from './screens/Decks';
import { SessionScreen } from './screens/SessionScreen';
import { Settings } from './screens/Settings';
import { Stats } from './screens/Stats';
import { SummaryScreen } from './screens/SummaryScreen';
import { Today } from './screens/Today';

export function App() {
  const [screen, arg] = useRoute();
  switch (screen) {
    case 'session':
      return <SessionScreen />;
    case 'summary':
      return <SummaryScreen />;
    case 'decks':
      return <Decks />;
    case 'deck':
      return <DeckDetail key={arg} id={arg as DeckId} />;
    case 'stats':
      return <Stats />;
    case 'settings':
      return <Settings />;
    case 'cram':
      return <Cram />;
    default:
      return <Today />;
  }
}
