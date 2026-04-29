const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  // สร้างหน้าต่างโปรแกรม
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'), // ใช้ไฟล์ไอคอนแมวส้มที่ขยายแล้ว
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  
  win.setMenuBarVisibility(false)

  
  win.webContents.on('did-frame-finish-load', () => {
    win.webContents.closeDevTools()
  })
}

// เมื่อโปรแกรมพร้อม ให้สร้างหน้าต่าง
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ปิดโปรแกรมเมื่อปิดหน้าต่างทั้งหมด (ยกเว้นบน Mac)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})