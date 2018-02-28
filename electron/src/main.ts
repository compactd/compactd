import {app, BrowserWindow} from 'electron';


app.on('ready', () => {
 const mainWindow = new BrowserWindow({
   width: 1024, height: 768
 });
 mainWindow.loadURL(`http://localhost:8080/`);
});