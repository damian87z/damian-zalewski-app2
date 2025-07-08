// PWA Functions - Instalacja i zarządzanie aplikacją
// Funkcjonalności Progressive Web App

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupInstallPrompt();
        this.setupUpdateCheck();
        this.checkUrlAction();
    }

    checkInstallation() {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('PWA: App is installed and running in standalone mode');
        } else if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('PWA: App is installed (iOS)');
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt available');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event so it can be triggered later
            this.deferredPrompt = e;
            // Show install button if not already installed
            if (!this.isInstalled) {
                this.showInstallButton();
            }
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA: App was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showToast('Aplikacja została zainstalowana!', 'success');
        });
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        let installBtn = document.getElementById('installButton');
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'installButton';
            installBtn.className = 'fixed bottom-24 right-4 bg-primary text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-all z-40';
            installBtn.innerHTML = '<i class="fas fa-download"></i>';
            installBtn.title = 'Zainstaluj aplikację';
            installBtn.onclick = () => this.promptInstall();
            document.body.appendChild(installBtn);
        }
        installBtn.style.display = 'block';
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installButton');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    promptInstall() {
        if (this.deferredPrompt) {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('PWA: User accepted the install prompt');
                } else {
                    console.log('PWA: User dismissed the install prompt');
                }
                this.deferredPrompt = null;
            });
        } else {
            // Fallback for browsers that don't support the install prompt
            this.showInstallInstructions();
        }
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        if (isIOS) {
            instructions = 'Aby zainstalować aplikację na iOS:\n1. Dotknij ikony udostępniania\n2. Wybierz "Dodaj do ekranu głównego"';
        } else if (isAndroid) {
            instructions = 'Aby zainstalować aplikację na Androidzie:\n1. Otwórz menu przeglądarki\n2. Wybierz "Dodaj do ekranu głównego"';
        } else {
            instructions = 'Aby zainstalować aplikację:\n1. Otwórz menu przeglądarki\n2. Wybierz "Zainstaluj aplikację" lub "Dodaj do ekranu głównego"';
        }
        
        alert(instructions);
    }

    setupUpdateCheck() {
        // Check for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('PWA: New service worker activated');
                this.showUpdateAvailable();
            });

            // Check for updates periodically
            setInterval(() => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'CHECK_UPDATE'
                    });
                }
            }, 60000); // Check every minute
        }
    }

    showUpdateAvailable() {
        // Create update notification
        const updateBanner = document.createElement('div');
        updateBanner.id = 'updateBanner';
        updateBanner.className = 'fixed top-16 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50';
        updateBanner.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold">Dostępna aktualizacja</p>
                    <p class="text-sm opacity-90">Odśwież aby załadować nową wersję</p>
                </div>
                <button onclick="pwaManager.updateApp()" class="bg-white text-blue-600 px-3 py-1 rounded font-semibold text-sm">
                    Odśwież
                </button>
            </div>
        `;
        
        // Remove existing banner if present
        const existingBanner = document.getElementById('updateBanner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        document.body.appendChild(updateBanner);
    }

    updateApp() {
        // Remove update banner
        const updateBanner = document.getElementById('updateBanner');
        if (updateBanner) {
            updateBanner.remove();
        }
        
        // Skip waiting and reload
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SKIP_WAITING'
            });
        }
        
        // Reload the page
        window.location.reload();
    }

    checkUrlAction() {
        // Check for URL parameters to handle shortcuts
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action && window.app) {
            setTimeout(() => {
                switch(action) {
                    case 'add-contact':
                        window.app.showSection('add-contact');
                        break;
                    case 'meetings':
                        window.app.showSection('meetings');
                        break;
                    case 'contacts':
                        window.app.showSection('contacts');
                        break;
                    default:
                        window.app.showSection('dashboard');
                }
            }, 100);
        }
    }

    // Utility function for showing toasts
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-60 px-4 py-2 rounded-lg text-white font-medium ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Add animation
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            toast.style.transition = 'all 0.3s ease';
        }, 2700);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Network status monitoring
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('PWA: Back online');
            this.showToast('Połączenie przywrócone', 'success');
            // Sync any pending data
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            console.log('PWA: Gone offline');
            this.showToast('Pracujesz offline', 'warning');
        });
    }

    syncPendingData() {
        // Implement data synchronization when back online
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                return registration.sync.register('background-sync-sms');
            }).catch((error) => {
                console.log('PWA: Background sync failed', error);
            });
        }
    }

    // Share API integration
    async shareContent(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                console.log('PWA: Content shared successfully');
            } catch (error) {
                console.log('PWA: Share failed', error);
                this.fallbackShare(data);
            }
        } else {
            this.fallbackShare(data);
        }
    }

    fallbackShare(data) {
        // Fallback sharing for browsers without Web Share API
        const shareText = `${data.title}\n${data.text}\n${data.url}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('Skopiowano do schowka', 'success');
            });
        } else {
            // Even older fallback
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Skopiowano do schowka', 'success');
        }
    }

    // Notification permission handling
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('PWA: Notification permission granted');
                this.showToast('Powiadomienia włączone', 'success');
                return true;
            } else {
                console.log('PWA: Notification permission denied');
                this.showToast('Powiadomienia wyłączone', 'warning');
                return false;
            }
        }
        return false;
    }

    // Send local notification
    showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/images/app-icon.jpg',
                badge: '/images/app-icon.jpg',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        }
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
    window.pwaManager.setupNetworkMonitoring();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}
