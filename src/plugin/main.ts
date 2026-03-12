import { PluginMessage, Settings } from '../shared/types';
import { getAllTokens } from './variables';

figma.showUI(__html__, { width: 400, height: 560 });

// Push updated tokens to UI on any document change
figma.on('documentchange', () => {
  const tokens = getAllTokens();
  figma.ui.postMessage({ type: 'ALL_TOKENS_RESULT', tokens } satisfies PluginMessage);
});

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case 'GET_ALL_TOKENS': {
        const tokens = getAllTokens();
        figma.ui.postMessage({ type: 'ALL_TOKENS_RESULT', tokens } satisfies PluginMessage);
        break;
      }

      case 'GET_SETTINGS': {
        const settings: Settings = {
          pat: (await figma.clientStorage.getAsync('pat')) ?? '',
          owner: (await figma.clientStorage.getAsync('owner')) ?? '',
          repo: (await figma.clientStorage.getAsync('repo')) ?? '',
          branch: (await figma.clientStorage.getAsync('branch')) ?? 'main',
          filePath: (await figma.clientStorage.getAsync('filePath')) ?? 'tokens/tokens.json',
        };
        figma.ui.postMessage({ type: 'SETTINGS_RESULT', settings } satisfies PluginMessage);
        break;
      }

      case 'SAVE_SETTINGS': {
        const { settings } = msg;
        await figma.clientStorage.setAsync('pat', settings.pat);
        await figma.clientStorage.setAsync('owner', settings.owner);
        await figma.clientStorage.setAsync('repo', settings.repo);
        await figma.clientStorage.setAsync('branch', settings.branch);
        await figma.clientStorage.setAsync('filePath', settings.filePath);
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    figma.ui.postMessage({ type: 'ERROR', message } satisfies PluginMessage);
  }
};
