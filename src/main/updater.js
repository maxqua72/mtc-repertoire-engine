import { app, autoUpdater, dialog } from 'electron';
import log from 'electron-log/main.js';
//import { version } from '../../package.json' assert { type: 'json' }; // Assicurati che package.json sia accessibile

//log.transports.file.resolvePathFn  = () => app.getPath('userData') + '/updates.log';
log.info('App starting...');
log.info('Current version:', app.getVersion());

const server = 'https://update.electronjs.org';
const feed = `${server}/maxqua72/mtc-repertoire-engine/${process.platform}/${app.getVersion()}/RELEASES`


log.info('feed:', feed);

export async function checkForUpdates() { // Esporta la funzione come asincrona
  autoUpdater.setFeedURL({ url: feed });

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available');
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Aggiornamento disponibile',
      message: `È disponibile una nuova versione. L'applicazione verrà scaricata in background.`,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater.', err);
    dialog.showErrorBox('Errore durante l\'aggiornamento', err.message);
  });

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    log.info('Update downloaded:', releaseName);
    const dialogOpts = {
      type: 'info',
      buttons: ['Riavvia e installa', 'Più tardi'],
      title: 'Aggiornamento scaricato',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'Riavvia l\'applicazione per installare l\'aggiornamento.',
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdates();
}