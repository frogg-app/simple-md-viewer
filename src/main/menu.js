const { Menu, shell } = require('electron');

function createMenu(mainWindow, store, handlers) {
  const { openFile, openRemote, reloadFile, setTheme, toggleLiveUpdates, setPollInterval, disconnectRemote } = handlers;

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: openFile
        },
        {
          label: 'Open Remote...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: openRemote
        },
        {
          label: 'Open Recent',
          submenu: buildRecentFilesMenu(store, mainWindow)
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: reloadFile
        },
        { type: 'separator' },
        {
          label: 'Disconnect',
          id: 'disconnect',
          enabled: false,
          click: disconnectRemote
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          role: 'quit'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow.webContents.send('zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('zoom-out')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('zoom-reset')
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          role: 'togglefullscreen'
        },
        { type: 'separator' },
        {
          label: 'Live Updates',
          submenu: [
            {
              label: 'Enabled',
              type: 'checkbox',
              checked: store.get('liveUpdates'),
              click: (menuItem) => {
                const enabled = toggleLiveUpdates();
                menuItem.checked = enabled;
              }
            },
            { type: 'separator' },
            {
              label: 'Poll Interval',
              submenu: [
                {
                  label: '1 second',
                  type: 'radio',
                  checked: store.get('pollInterval') === 1000,
                  click: () => setPollInterval(1000)
                },
                {
                  label: '2 seconds',
                  type: 'radio',
                  checked: store.get('pollInterval') === 2000,
                  click: () => setPollInterval(2000)
                },
                {
                  label: '5 seconds',
                  type: 'radio',
                  checked: store.get('pollInterval') === 5000,
                  click: () => setPollInterval(5000)
                },
                {
                  label: '10 seconds',
                  type: 'radio',
                  checked: store.get('pollInterval') === 10000,
                  click: () => setPollInterval(10000)
                }
              ]
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              type: 'radio',
              checked: store.get('theme') === 'light',
              click: () => setTheme('light')
            },
            {
              label: 'Dark',
              type: 'radio',
              checked: store.get('theme') === 'dark',
              click: () => setTheme('dark')
            },
            {
              label: 'System',
              type: 'radio',
              checked: store.get('theme') === 'system',
              click: () => setTheme('system')
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Connection',
      submenu: [
        {
          label: 'Manage Saved Credentials...',
          click: () => mainWindow.webContents.send('manage-credentials')
        },
        {
          label: 'Clear All Saved Credentials',
          click: () => mainWindow.webContents.send('clear-credentials')
        },
        { type: 'separator' },
        {
          label: 'Connection Status',
          enabled: false,
          id: 'connection-status'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow.webContents.send('show-shortcuts')
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => mainWindow.webContents.send('show-about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  return menu;
}

function buildRecentFilesMenu(store, mainWindow) {
  const recentFiles = store.get('recentFiles') || [];

  if (recentFiles.length === 0) {
    return [{ label: 'No Recent Files', enabled: false }];
  }

  const items = recentFiles.map(filePath => ({
    label: filePath,
    click: () => {
      mainWindow.webContents.send('open-file-request', filePath);
    }
  }));

  items.push({ type: 'separator' });
  items.push({
    label: 'Clear Recent Files',
    click: () => {
      store.set('recentFiles', []);
    }
  });

  return items;
}

module.exports = { createMenu };
