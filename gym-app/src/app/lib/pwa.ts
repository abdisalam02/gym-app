// Check if service workers are supported
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('New service worker installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker installed, update available');
                // Notify user of updates
                showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    });
    
    // Listen for controller change (when a new SW takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
    });
  } else {
    console.log('Service workers are not supported by this browser');
  }
}

// Add event listeners for PWA installation
export function setupPWAInstallPrompt(): void {
  let deferredPrompt: any;
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default prompt
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Show your custom "Add to Home Screen" button or UI element
    showInstallPrompt();
  });
  
  // Track when the PWA is installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    
    // Hide the install promotion if it was showing
    hideInstallPrompt();
    
    // Clear the deferredPrompt
    deferredPrompt = null;
  });
}

// Show a UI notification for updates
function showUpdateNotification(): void {
  // Implementation will depend on your UI framework and components
  // Example: Display a toast or banner
  if (typeof document !== 'undefined') {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <p>A new version is available!</p>
        <button id="update-button">Update Now</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#38bdf8';
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '1000';
    
    // Add click handler
    const updateButton = document.getElementById('update-button');
    if (updateButton) {
      updateButton.addEventListener('click', () => {
        // Reload the page to activate the new service worker
        window.location.reload();
      });
    }
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }
}

// Show a UI prompt for installation
function showInstallPrompt(): void {
  // Implementation will depend on your UI framework and components
  // Example: Display a toast or banner
  if (typeof document !== 'undefined') {
    const prompt = document.createElement('div');
    prompt.id = 'install-prompt';
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>Add GymTrack to your home screen!</p>
        <div class="prompt-buttons">
          <button id="install-button">Install</button>
          <button id="dismiss-button">Not Now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Add styles
    prompt.style.position = 'fixed';
    prompt.style.bottom = '20px';
    prompt.style.left = '50%';
    prompt.style.transform = 'translateX(-50%)';
    prompt.style.backgroundColor = '#38bdf8';
    prompt.style.color = 'white';
    prompt.style.padding = '12px 16px';
    prompt.style.borderRadius = '8px';
    prompt.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    prompt.style.zIndex = '1000';
    
    // Add button handlers
    const installButton = document.getElementById('install-button');
    const dismissButton = document.getElementById('dismiss-button');
    
    if (installButton) {
      installButton.addEventListener('click', async () => {
        hideInstallPrompt();
        
        // Show the install prompt
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          
          // Wait for the user to respond to the prompt
          const { outcome } = await window.deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          
          // Clear the deferredPrompt variable
          window.deferredPrompt = null;
        }
      });
    }
    
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        hideInstallPrompt();
      });
    }
  }
}

// Hide the installation prompt
function hideInstallPrompt(): void {
  if (typeof document !== 'undefined') {
    const prompt = document.getElementById('install-prompt');
    if (prompt && prompt.parentNode) {
      prompt.parentNode.removeChild(prompt);
    }
  }
}

// Add custom type for the deferredPrompt to window
declare global {
  interface Window {
    deferredPrompt: any;
  }
} 