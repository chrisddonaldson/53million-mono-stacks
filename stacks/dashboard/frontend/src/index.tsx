/* @refresh reload */
import { render } from 'solid-js/web';
import { Router } from "@solidjs/router";

import './index.css';
import App from './App';

const root = document.getElementById('root');

async function enableMocking() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser');
      // Pass { onUnhandledRequest: 'bypass' } to silence warnings for assets/chrome extensions
      await worker.start({ onUnhandledRequest: 'bypass' });
      console.log('[MSW] Mocking enabled');
    } catch (error) {
      console.warn('[MSW] Failed to start service worker:', error);
      // Continue anyway - app should work without MSW
    }
  }
}

enableMocking().then(() => {
    if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
      throw new Error(
        'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
      );
    }
    
    render(() => <App />, root!);
}).catch((error) => {
    console.error('Failed to initialize app:', error);
});
