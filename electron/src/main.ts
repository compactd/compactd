import {app, BrowserWindow} from 'electron';
import { join } from 'path';

app.on('ready', () => {
 const mainWindow = new BrowserWindow({
   width: 1366, height: 768, frame: false, webPreferences: {
     webSecurity: false
  }
 });
 mainWindow.loadURL(`http://localhost:8080/`);
});