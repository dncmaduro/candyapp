import { app, BrowserWindow } from 'electron'
import path from 'path'
import { spawn } from 'child_process'

let nestProcess: any

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Dev mode
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }
}

app.whenReady().then(() => {
  // Start NestJS backend
  nestProcess = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit'
  })

  createWindow()

  app.on('window-all-closed', () => {
    if (nestProcess) nestProcess.kill()
    if (process.platform !== 'darwin') app.quit()
  })
})
