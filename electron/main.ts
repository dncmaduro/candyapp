import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let nestProcess: any;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Dev mode
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8386');
  } else {
    win.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  // win.loadURL('http://localhost:8386');
};

const waitForFrontend = (timeout = 10000): Promise<void> => {
  // Poll mỗi 500ms, timeout sau 10s
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.request(
        { hostname: 'localhost', port: 8386, path: '/', method: 'GET', timeout: 1000 },
        (res) => {
          // Nếu server trả code 200||301||302, coi như sẵn sàng
          if ([200, 301, 302].includes(res.statusCode || 0)) {
            res.destroy();
            resolve();
          } else {
            retry();
          }
        },
      );
      req.on('error', retry);
      req.end();

      function retry() {
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout khi chờ frontend ở port 8386'));
        } else {
          setTimeout(check, 500);
        }
      }
    };
    check();
  });
};

app.whenReady().then(async () => {
  // Khởi backend Nest
  nestProcess = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname, '../../backend'),
    stdio: 'inherit',
  });

  try {
    await waitForFrontend(15000); // timeout 15s
    createWindow();
  } catch (err) {
    console.error(err);
    app.quit();
  }

  app.on('window-all-closed', () => {
    if (nestProcess) nestProcess.kill();
    if (process.platform !== 'darwin') app.quit();
  });
});
