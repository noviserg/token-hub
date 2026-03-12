import { Settings, PluginMessage } from '../../shared/types';

export function sendMessage(msg: PluginMessage) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

export function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      const msg: PluginMessage = event.data.pluginMessage;
      if (msg?.type === 'SETTINGS_RESULT') {
        window.removeEventListener('message', handler);
        resolve(msg.settings);
      }
    };
    window.addEventListener('message', handler);
    sendMessage({ type: 'GET_SETTINGS' });
  });
}

export function saveSettings(settings: Settings): void {
  sendMessage({ type: 'SAVE_SETTINGS', settings });
}
