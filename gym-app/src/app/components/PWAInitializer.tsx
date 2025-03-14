'use client';

import { useEffect } from 'react';
import { registerServiceWorker, setupPWAInstallPrompt } from '../lib/pwa';

export default function PWAInitializer() {
  useEffect(() => {
    // Initialize PWA features
    registerServiceWorker();
    setupPWAInstallPrompt();
  }, []);

  // This component doesn't render anything visible
  return null;
} 