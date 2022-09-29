const {app, BrowserWindow} = require('electron')

const server = require('./server'); //ADD THIS
const serverPort = process.env.APP_PORT || 19081;

let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1200,
    // title: 'Registar',
    // titleBarStyle: 'hiddenInset',
    // show: false,
    resizable: true,
    // fullscreen: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL("http://localhost:" + serverPort)  //ADD THIS
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('resize', function(e,x,y){
  mainWindow.setSize(x, y);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})