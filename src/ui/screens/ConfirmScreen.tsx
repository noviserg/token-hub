import React, { useState } from 'react';
import { DiffEntry } from '../../shared/types';

interface Props {
  diff: DiffEntry[];
  onBack: () => void;
  onPush: (commitMessage: string, mode: 'commit' | 'pr') => void;
}

export default function ConfirmScreen({ diff, onBack, onPush }: Props) {
  const changed = diff.filter((d) => d.status !== 'unchanged').length;
  const [message, setMessage] = useState(
    `chore: sync design tokens from Figma (${changed} changes)`
  );
  const [mode, setMode] = useState<'commit' | 'pr'>('commit');

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="header-row">
          <button className="btn-back" onClick={onBack}>←</button>
          <h1>Подтверждение</h1>
        </div>
        <p className="subtitle">{changed} изменений будет отправлено</p>
      </div>

      <div className="form">
        <div className="mode-selector">
          <label className={`mode-option ${mode === 'commit' ? 'active' : ''}`}>
            <input
              type="radio"
              value="commit"
              checked={mode === 'commit'}
              onChange={() => setMode('commit')}
            />
            <div>
              <strong>Прямой коммит</strong>
              <p>Запишет изменения напрямую в ветку</p>
            </div>
          </label>
          <label className={`mode-option ${mode === 'pr' ? 'active' : ''}`}>
            <input
              type="radio"
              value="pr"
              checked={mode === 'pr'}
              onChange={() => setMode('pr')}
            />
            <div>
              <strong>Pull Request</strong>
              <p>Создаст ветку figma-sync/YYYY-MM-DD и PR</p>
            </div>
          </label>
        </div>

        {mode === 'commit' && (
          <label>
            <span>Сообщение коммита</span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="screen-footer">
        <button
          className="btn-primary"
          disabled={mode === 'commit' && !message.trim()}
          onClick={() => onPush(message, mode)}
        >
          {mode === 'commit' ? 'Отправить коммит' : 'Создать PR'}
        </button>
      </div>
    </div>
  );
}
