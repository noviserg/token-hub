import React, { useState } from 'react';
import { Settings } from '../../shared/types';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
}

export default function SetupScreen({ settings, onSave }: Props) {
  const [form, setForm] = useState<Settings>(settings);

  function set(key: keyof Settings, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Настройки</h1>
        <p className="subtitle">Подключение к GitHub</p>
      </div>

      <div className="form">
        <label>
          <span>GitHub Personal Access Token</span>
          <input
            type="password"
            placeholder="ghp_..."
            value={form.pat}
            onChange={(e) => set('pat', e.target.value)}
          />
          <span className="hint">Scope: repo (или contents:write)</span>
        </label>

        <label>
          <span>Репозиторий</span>
          <input
            type="text"
            placeholder="owner/repo"
            value={`${form.owner}${form.owner || form.repo ? '/' : ''}${form.repo}`}
            onChange={(e) => {
              const [owner, ...rest] = e.target.value.split('/');
              set('owner', owner);
              set('repo', rest.join('/'));
            }}
          />
        </label>

        <label>
          <span>Ветка</span>
          <input
            type="text"
            placeholder="main"
            value={form.branch}
            onChange={(e) => set('branch', e.target.value)}
          />
        </label>

        <label>
          <span>Путь к файлу токенов</span>
          <input
            type="text"
            placeholder="tokens/tokens.json"
            value={form.filePath}
            onChange={(e) => set('filePath', e.target.value)}
          />
        </label>
      </div>

      <div className="screen-footer">
        <button
          className="btn-primary"
          disabled={!form.pat || !form.owner || !form.repo}
          onClick={() => onSave(form)}
        >
          Подключить
        </button>
      </div>
    </div>
  );
}
