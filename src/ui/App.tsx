import React, { useState, useEffect } from 'react';
import { Settings, TokenFile, DiffEntry } from '../shared/types';
import { sendMessage, getSettings, saveSettings } from './services/storage';
import { computeDiff, buildChangelog, flattenTokenFile } from './services/diff';
import { GitHubClient } from './services/github';
import SetupScreen from './screens/SetupScreen';
import MainScreen from './screens/MainScreen';
import TokensScreen from './screens/TokensScreen';
import DiffScreen from './screens/DiffScreen';
import ConfirmScreen from './screens/ConfirmScreen';
import ResultScreen from './screens/ResultScreen';

export type Screen = 'setup' | 'main' | 'tokens' | 'diff' | 'confirm' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    pat: '', owner: '', repo: '', branch: 'main', filePath: 'tokens/tokens.json',
  });
  const [tokens, setTokens] = useState<TokenFile>({});
  const [remoteTokens, setRemoteTokens] = useState<TokenFile>({});
  const [remoteSha, setRemoteSha] = useState('');
  const [diff, setDiff] = useState<DiffEntry[]>([]);
  const [resultUrl, setResultUrl] = useState('');
  const [resultType, setResultType] = useState<'commit' | 'pr'>('commit');

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      if (s.pat && s.owner && s.repo) {
        setScreen('main');
        loadTokens();
      }
    });

    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      if (msg.type === 'ALL_TOKENS_RESULT') {
        setTokens(msg.tokens);
        setLoading(false);
      } else if (msg.type === 'ERROR') {
        setError(msg.message);
        setLoading(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  function loadTokens() {
    setLoading(true);
    sendMessage({ type: 'GET_ALL_TOKENS' });
  }

  async function handleSaveSettings(s: Settings) {
    saveSettings(s);
    setSettings(s);
    try {
      setLoading(true);
      const client = new GitHubClient(s);
      await client.validatePat();
      setScreen('main');
      sendMessage({ type: 'GET_ALL_TOKENS' });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  async function handleRunDiff() {
    setLoading(true);
    setError(null);
    try {
      const client = new GitHubClient(settings);
      const { content, sha } = await client.getFileContent();
      const d = computeDiff(content, tokens);
      setRemoteTokens(content);
      setRemoteSha(sha);
      setDiff(d);
      setScreen('diff');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handlePush(commitMessage: string, mode: 'commit' | 'pr') {
    setLoading(true);
    setError(null);
    try {
      const client = new GitHubClient(settings);
      const changelog = buildChangelog(diff);
      let url: string;
      if (mode === 'pr') {
        const res = await client.createPR(tokens, remoteSha, changelog);
        url = res.html_url;
        // For PR we re-fetch SHA since the base branch wasn't changed
        const { sha: freshSha } = await client.getFileContent();
        setRemoteSha(freshSha);
      } else {
        const res = await client.commitFile(tokens, remoteSha, commitMessage);
        url = res.html_url;
        // Use SHA from the PUT response — no extra round-trip needed
        setRemoteSha(res.newSha);
      }
      setRemoteTokens(tokens);
      setDiff([]);
      setResultUrl(url);
      setResultType(mode);
      setScreen('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const tokenCount = Object.keys(flattenTokenFile(tokens)).length;

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {loading && <div className="loading-overlay"><div className="spinner" /></div>}

      {screen === 'setup' && (
        <SetupScreen settings={settings} onSave={handleSaveSettings} />
      )}
      {screen === 'main' && (
        <MainScreen
          tokenCount={tokenCount}
          settings={settings}
          onViewTokens={() => setScreen('tokens')}
          onRunDiff={handleRunDiff}
          onRefresh={loadTokens}
          onOpenSettings={() => setScreen('setup')}
        />
      )}
      {screen === 'tokens' && (
        <TokensScreen tokens={tokens} onBack={() => setScreen('main')} />
      )}
      {screen === 'diff' && (
        <DiffScreen
          diff={diff}
          onBack={() => setScreen('main')}
          onConfirm={() => setScreen('confirm')}
        />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen
          diff={diff}
          onBack={() => setScreen('diff')}
          onPush={handlePush}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          url={resultUrl}
          type={resultType}
          diff={diff}
          onDone={() => setScreen('main')}
        />
      )}
    </div>
  );
}
