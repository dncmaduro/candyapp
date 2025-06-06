import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let nestProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let startupTimeout: NodeJS.Timeout | null = null;

// Set up logging to file
const logPath = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}
const logFile = path.join(logPath, 'app.log');
const logger = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
};

logger(`App starting - version ${app.getVersion()}`);
logger(`User data path: ${app.getPath('userData')}`);
logger(`App path: ${app.getAppPath()}`);
logger(`__dirname: ${__dirname}`);

const createWindow = () => {
  logger('Creating main window');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Dev mode
  if (process.env.NODE_ENV === 'development') {
    logger('Loading development URL');
    mainWindow.loadURL('http://localhost:8386');
  } else {
    // Try multiple potential locations for frontend files
    const possiblePaths = [
      // Standard path in packaged app
      path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
      // Alternative path based on extraResources configuration
      path.join(app.getAppPath(), '..', 'frontend', 'dist', 'index.html'),
      // Path relative to executable
      path.join(app.getAppPath(), 'frontend', 'dist', 'index.html'),
      // Development path
      path.join(__dirname, '../../frontend/dist/index.html'),
    ];

    let frontendLoaded = false;

    // Try each path until we find one that exists
    for (const frontendPath of possiblePaths) {
      logger(`Trying frontend path: ${frontendPath}`);

      if (fs.existsSync(frontendPath)) {
        logger(`Found frontend at: ${frontendPath}`);
        mainWindow
          .loadFile(frontendPath)
          .then(() => {
            frontendLoaded = true;
            logger('Frontend loaded successfully');
          })
          .catch((err) => {
            logger(`Error loading frontend from ${frontendPath}: ${err.message}`);
          });
        break;
      } else {
        logger(`Path not found: ${frontendPath}`);
      }
    }

    // If no path worked, show error page
    if (!frontendLoaded) {
      logger('No valid frontend path found, showing error page');
      mainWindow.loadURL(
        'data:text/html,<html><body style="font-family: sans-serif; padding: 2rem;"><h2>Application Error</h2><p>Frontend files not found.</p><pre>Searched paths:\n' +
          possiblePaths.join('\n') +
          '</pre></body></html>',
      );

      dialog.showErrorBox(
        'Frontend Not Found',
        'The application frontend files could not be found. Please reinstall the application.',
      );
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    logger('Window ready to show');
    if (mainWindow) mainWindow.show();
    if (startupTimeout) {
      clearTimeout(startupTimeout);
      startupTimeout = null;
    }
  });

  mainWindow.on('closed', () => {
    logger('Main window closed');
    mainWindow = null;
  });
};

// Set a timeout to show the window anyway, even if backend fails
const setupStartupTimeout = () => {
  startupTimeout = setTimeout(() => {
    logger('Startup timeout reached - forcing window creation');
    if (!mainWindow) {
      createWindow();
      dialog.showMessageBox({
        type: 'warning',
        title: 'Backend Service Warning',
        message:
          'The application may not function properly as the backend service did not start correctly.',
        buttons: ['OK'],
      });
    }
  }, 20000); // 20 second timeout as a fallback
};

const waitForFrontend = (timeout = 10000): Promise<void> => {
  logger(`Waiting for frontend service (timeout: ${timeout}ms)`);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.request(
        { hostname: 'localhost', port: 8386, path: '/', method: 'GET', timeout: 1000 },
        (res) => {
          if ([200, 301, 302].includes(res.statusCode || 0)) {
            logger('Frontend service is ready');
            res.destroy();
            resolve();
          } else {
            logger(`Frontend check responded with status: ${res.statusCode}`);
            retry();
          }
        },
      );

      req.on('error', (err) => {
        logger(`Frontend check error: ${err.message}`);
        retry();
      });

      req.end();

      function retry() {
        if (Date.now() - start > timeout) {
          logger('Frontend service timed out');
          reject(new Error('Timeout waiting for frontend on port 8386'));
        } else {
          setTimeout(check, 500);
        }
      }
    };
    check();
  });
};

// Function to forcefully terminate the backend process
const terminateBackendProcess = () => {
  if (nestProcess) {
    logger('Terminating backend process...');

    // On Windows, use taskkill to terminate process tree
    if (process.platform === 'win32' && nestProcess.pid) {
      try {
        logger(`Using taskkill on PID ${nestProcess.pid}`);
        spawn('taskkill', ['/pid', nestProcess.pid.toString(), '/f', '/t']);
      } catch (e) {
        logger(`Failed to kill process with taskkill: ${e}`);
      }
    }

    try {
      nestProcess.kill('SIGTERM');
      setTimeout(() => {
        if (nestProcess) {
          logger('Sending SIGKILL to backend process');
          nestProcess.kill('SIGKILL');
        }
      }, 1000);
    } catch (e) {
      logger(`Error killing backend process: ${e}`);
    }

    nestProcess = null;
  }
};

app.whenReady().then(async () => {
  // Set up fallback timeout
  setupStartupTimeout();

  // Fix: Determine the correct path for backend based on environment
  const isPackaged = app.isPackaged;
  const backendPath = isPackaged
    ? path.join(process.resourcesPath, 'app', 'backend')
    : path.join(__dirname, '../../backend');

  logger(`Backend path: ${backendPath}`);
  logger(`App is packaged: ${isPackaged}`);

  // Check if backend files exist
  try {
    const mainJsPath = path.join(backendPath, 'dist/main.js');
    logger(`Checking if backend file exists: ${mainJsPath}`);
    if (fs.existsSync(mainJsPath)) {
      logger('Backend main.js file exists');
    } else {
      logger('ERROR: Backend main.js file does not exist!');
    }
  } catch (err) {
    logger(`Error checking backend files: ${err}`);
  }

  // Start the backend process with proper error handling
  try {
    logger('Starting backend process');
    nestProcess = spawn(process.execPath, ['dist/main.js'], {
      cwd: backendPath,
      stdio: 'pipe', // Changed from 'inherit' to capture output
      detached: false,
      env: { ...process.env, NODE_ENV: isPackaged ? 'production' : 'development' },
    });

    // Capture stdout and stderr
    if (nestProcess.stdout) {
      nestProcess.stdout.on('data', (data) => {
        logger(`Backend stdout: ${data}`);
      });
    }

    if (nestProcess.stderr) {
      nestProcess.stderr.on('data', (data) => {
        logger(`Backend stderr: ${data}`);
      });
    }

    nestProcess.on('error', (err: Error) => {
      logger(`Failed to start backend process: ${err.message}`);
      // Create window anyway, with error message
      if (!mainWindow) {
        createWindow();
        dialog.showErrorBox(
          'Backend Error',
          `The backend service failed to start: ${err.message}\n\nApplication may not function correctly.`,
        );
      }
    });

    nestProcess.on('exit', (code: number | null, signal: string | null) => {
      logger(`Backend process exited with code ${code} and signal ${signal}`);
      nestProcess = null;

      // If the backend exits unexpectedly and we're not quitting, show error
      if (!isQuitting && mainWindow) {
        dialog.showMessageBox({
          type: 'error',
          title: 'Backend Service Error',
          message:
            'The backend service has stopped unexpectedly. The application may not function properly.',
          buttons: ['OK'],
        });
      }
    });

    logger('Backend process started, waiting for frontend');
    // Try to wait for frontend, but move on after timeout
    try {
      await waitForFrontend(15000);
      createWindow();
    } catch (err) {
      logger(`Frontend wait error: ${err}`);
      // Create window anyway
      createWindow();
    }
  } catch (err) {
    logger(`Error spawning backend process: ${err}`);
    // Create window anyway with error
    createWindow();
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start backend service: ${err}\n\nApplication may not function correctly.`,
    );
  }

  // Handle application lifecycle events
  app.on('window-all-closed', () => {
    logger('All windows closed');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', (event) => {
    logger('App is quitting...');
    isQuitting = true;

    if (nestProcess) {
      event.preventDefault(); // Prevent immediate quit
      terminateBackendProcess();

      // Continue quitting after a delay
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.exit(0); // Use exit instead of quit to force close
      }, 1500);
    }
  });

  app.on('quit', () => {
    logger('App quit event fired');
    terminateBackendProcess();
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger(`Uncaught exception: ${error}`);
  dialog.showErrorBox('Application Error', `An unexpected error occurred: ${error.message}`);
  terminateBackendProcess();
  app.exit(1);
});
