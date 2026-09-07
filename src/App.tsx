import { useEffect } from 'react';
import { NowProvider } from './lib/useNow';
import { preloadPandaArt } from './lib/pandaArt';
import { WarningScheduler } from './components/WarningScheduler';
import { SummaryDirector } from './components/SummaryDirector';
import { MainScreen } from './screens/MainScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ParentPanel } from './screens/parent/ParentPanel';
import { EvolutionScreen } from './screens/EvolutionScreen';
import { StartScreen } from './screens/StartScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { useStore } from './store/useStore';

function Screen() {
  const screen = useStore((s) => s.uiScreen);
  const onboardingDone = useStore((s) => s.onboardingDone);
  if (!onboardingDone || screen === 'onboarding') return <OnboardingScreen />;
  if (screen === 'start') return <StartScreen />;
  if (screen === 'parent') return <ParentPanel />;
  if (screen === 'summary') return <SummaryScreen />;
  if (screen === 'shop') return <EvolutionScreen />;
  return <MainScreen />;
}

export function App() {
  const hydrated = useStore((s) => s._hasHydrated);

  useEffect(() => {
    preloadPandaArt();
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper text-lg text-muted">
        Ładowanie dojo…
      </div>
    );
  }

  return (
    <NowProvider>
      <WarningScheduler />
      <SummaryDirector />
      <Screen />
    </NowProvider>
  );
}
