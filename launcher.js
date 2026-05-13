// HardCore POS Launcher
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let mainWindow;

// Error handling for production
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox('Application Error', 
        'An unexpected error occurred. The application will restart.\n\n' + error.message);
    app.relaunch();
    app.exit(0);
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'icon.ico'),
        title: 'HardCore FiscalPOS',
        show: true
    });

    // Load your web app
    mainWindow.loadURL('https://fiscalcore.lovable.app');
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
