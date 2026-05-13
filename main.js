const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const https = require('https');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let splashWindow;
let updateAvailable = false;

// Enable auto-updater logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Check for updates on start
autoUpdater.checkForUpdatesAndNotify();

// Create splash screen (launcher window)
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // HTML for splash screen
    const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .container {
                text-align: center;
                color: white;
            }
            .logo {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .spinner {
                border: 4px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top: 4px solid white;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .status {
                margin-top: 20px;
                font-size: 14px;
                opacity: 0.9;
            }
            .version {
                position: absolute;
                bottom: 10px;
                right: 15px;
                font-size: 11px;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">?? HardCore POS</div>
            <div>Fiscal & Repair Management</div>
            <div class="spinner"></div>
            <div class="status" id="status">Loading application...</div>
        </div>
        <div class="version">v1.0.0</div>
        <script>
            const { ipcRenderer } = require('electron');
            ipcRenderer.on('update-status', (event, message) => {
                document.getElementById('status').innerText = message;
            });
        </script>
    </body>
    </html>
    `;

    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
    
    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

// Create main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false
        },
        icon: path.join(__dirname, 'icon.ico'),
        title: 'HardCore FiscalPOS'
    });

    // Load your web app
    mainWindow.loadURL('https://fiscalcore.lovable.app');
    
    // Show main window when ready
    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
            }
            mainWindow.setTitle('HardCore Tech - Fiscal POS & Repair Management');
            mainWindow.show();
            
            // Show update notification if available
            if (updateAvailable) {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Update Available',
                    message: 'A new version is available!',
                    detail: 'The update will be installed when you restart the application.',
                    buttons: ['OK']
                });
            }
        }, 2000);
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', 'Checking for updates...');
    }
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available');
    updateAvailable = true;
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', 'Downloading update...');
    }
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', 'Loading application...');
    }
});

autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', `Downloading update: ${progressObj.percent.toFixed(0)}%`);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('update-status', 'Update ready!');
    }
    
    // Ask user to restart
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded.',
        detail: 'Restart the application to install the update.',
        buttons: ['Restart Now', 'Later']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

// App lifecycle
app.whenReady().then(() => {
    createSplashWindow();
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
