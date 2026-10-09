import { App } from './App';
import { AppStoreProvider } from './store/AppStore';

/** The signed-in application, loaded as its own chunk. */
export function AppRoot() {
  return (
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  );
}
