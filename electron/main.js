const { app, BrowserWindow, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');

// Phase 4: Production Error Handling
const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'app.log');

function logInfo(msg) {
  const line = `[${new Date().toISOString()}] [INFO] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(line.trim());
}

function logError(msg, err) {
  const line = `[${new Date().toISOString()}] [ERROR] ${msg} - ${err ? err.stack : ''}\n`;
  fs.appendFileSync(logFile, line);
  console.error(line.trim());
}

process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', err);
  dialog.showErrorBox('Application Error', 'An unexpected error occurred. Please check the logs.');
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
});

// Port detection
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(startPort = 3000, endPort = 3100) {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${endPort}`);
}

// Server Health Check
function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server did not start within timeout'));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

// Phase 10: Self-Test System
function runDiagnostics() {
  logInfo("Running diagnostics...");
  const reportsDir = path.join(app.getPath('userData'), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    userDataPath: app.getPath('userData'),
    osPlatform: os.platform(),
    osRelease: os.release(),
    memoryTotal: os.totalmem(),
    memoryFree: os.freemem(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    status: 'PASS',
    issues: []
  };

  try {
    fs.accessSync(app.getPath('userData'), fs.constants.W_OK);
  } catch (err) {
    report.status = 'FAIL';
    report.issues.push('Cannot write to user data directory: ' + err.message);
  }

  fs.writeFileSync(path.join(reportsDir, 'startup_diagnostic.json'), JSON.stringify(report, null, 2));
  
  if (report.status === 'FAIL') {
    logError("Diagnostics failed: " + JSON.stringify(report.issues));
  } else {
    logInfo("Diagnostics passed.");
  }
}

let mainWindow;
let serverProcess;

async function createWindow() {
  runDiagnostics();

  // Resolve icon path for both dev and production
  let iconPath;
  if (app.isPackaged) {
    // In packaged app, public folder is in resources/standalone/public
    iconPath = path.join(process.resourcesPath, 'standalone', 'public', 'favicon.ico');
    // Fallback: try the electron directory
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(process.resourcesPath, 'app.asar', 'electron', '..', 'public', 'favicon.ico');
    }
  } else {
    iconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  }
  
  // Try PNG as fallback (Electron prefers PNG on some systems)
  let pngIconPath = iconPath.replace('favicon.ico', 'logo.png');
  const finalIconPath = fs.existsSync(iconPath) ? iconPath : (fs.existsSync(pngIconPath) ? pngIconPath : undefined);
  
  logInfo(`Icon path resolved to: ${finalIconPath || 'default electron icon'}`);
  logInfo(`Icon exists: ${finalIconPath ? fs.existsSync(finalIconPath) : false}`);

  // Create native image for the icon
  let appIcon;
  if (finalIconPath && fs.existsSync(finalIconPath)) {
    try {
      appIcon = nativeImage.createFromPath(finalIconPath);
      // Set the application icon (taskbar/dock icon)
      if (process.platform === 'win32' || process.platform === 'linux') {
        app.setIcon && app.setIcon(appIcon);
      }
      logInfo(`App icon loaded successfully (${appIcon.getSize().width}x${appIcon.getSize().height})`);
    } catch (e) {
      logError('Failed to load app icon', e);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    icon: finalIconPath || undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.maximize();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const isDev = !app.isPackaged;
  let port;

  try {
    port = await findAvailablePort();
    logInfo(`Selected port: ${port}`);
    
    // Inject the selected port and strict DATA_DIR to Next.js
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: port.toString(),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: isDev ? 'development' : 'production',
      DATA_DIR: app.getPath('userData')
    };

    if (isDev) {
      logInfo("Running in development mode...");
      mainWindow.loadURL(`http://localhost:3000`);
      mainWindow.show();
      return;
    }

    logInfo("Starting production Next.js standalone server...");
    
    // In production, run the standalone Next.js server
    // It is placed in resources/standalone by electron-builder
    let standaloneDir;
    if (app.isPackaged) {
      standaloneDir = path.join(process.resourcesPath, 'standalone');
    } else {
      standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
    }
    const serverScript = path.join(standaloneDir, 'server.js');
    
    if (!fs.existsSync(serverScript)) {
      throw new Error("Next.js standalone server not found at: " + serverScript);
    }

    serverProcess = spawn(process.execPath, [serverScript], {
      cwd: standaloneDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => logInfo(`[NEXT] ${data.toString().trim()}`));
    serverProcess.stderr.on('data', (data) => logError(`[NEXT ERR] ${data.toString().trim()}`));

    serverProcess.on('exit', (code) => {
      logInfo(`Next.js server exited with code ${code}`);
    });

    logInfo("Waiting for Next.js to be ready...");
    await waitForServer(port, 30000);
    logInfo("Next.js server is ready.");
    
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
    mainWindow.show();

  } catch (error) {
    logError("Failed to start application", error);
    // Phase 8: Blank Screen Prevention
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
    mainWindow.show();
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    logInfo("Killing Next.js server process and all its children...");
    if (process.platform === 'win32') {
      try {
        require('child_process').execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
      } catch (e) {
        logError("Error killing server process tree", e);
      }
    } else {
      serverProcess.kill('SIGTERM');
    }
  }
});
