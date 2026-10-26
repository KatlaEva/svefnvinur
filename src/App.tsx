import { useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Header } from './components/Header';
import { LogSheet } from './components/LogSheet';
import { TabBar } from './components/TabBar';
import { HelpFlowScreen } from './screens/HelpFlow';
import { HelpScreen } from './screens/Help';
import { MoreScreen } from './screens/More';
import { Onboarding } from './screens/Onboarding';
import { ProgressScreen } from './screens/Progress';
import { TodayScreen } from './screens/Today';

function Shell() {
  const { child, route, sheet, toastMsg } = useApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.tab, route.flow]);

  if (!child) return <Onboarding />;

  if (route.tab === 'help' && route.flow) {
    return (
      <>
        <HelpFlowScreen flowId={route.flow} />
        {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
      </>
    );
  }

  return (
    <div className="app">
      {route.tab === 'today' && <Header />}
      <main>
        {route.tab === 'today' && <TodayScreen />}
        {route.tab === 'help' && <HelpScreen />}
        {route.tab === 'progress' && <ProgressScreen />}
        {route.tab === 'more' && <MoreScreen />}
      </main>
      <TabBar />
      {sheet && <LogSheet />}
      <div aria-live="polite">{toastMsg && <div className="toast" role="status">{toastMsg}</div>}</div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
