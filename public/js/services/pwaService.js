// PWA Service: Manages Service Worker Registration, Install Prompts & Connectivity Monitoring
import { showToast } from '../ui/toast.js';

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.installBtn = null;
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupNetworkStatusListeners();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] ServiceWorker registration failed:', error);
          });
      });
    }
  }

  setupInstallPrompt() {
    this.installBtn = document.getElementById('btn-pwa-install');

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;

      if (this.installBtn) {
        this.installBtn.style.display = 'inline-flex';
        this.installBtn.addEventListener('click', () => this.promptInstall());
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] SCJ28 app successfully installed!');
      this.deferredPrompt = null;
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }
      showToast('🎉 SCJ28 App installed successfully!');
    });
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      showToast('Installing SCJ28 App...');
    }

    this.deferredPrompt = null;
    if (this.installBtn) {
      this.installBtn.style.display = 'none';
    }
  }

  setupNetworkStatusListeners() {
    window.addEventListener('online', () => {
      showToast('🌐 Back online! Data synchronized.');
    });

    window.addEventListener('offline', () => {
      showToast('⚡ You are offline. Changes will load from local cache.');
    });
  }
}

export const pwaService = new PWAService();
