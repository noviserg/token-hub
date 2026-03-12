import React from 'react';
import { Settings } from '../../shared/types';

interface Props {
  tokenCount: number;
  settings: Settings;
  onViewTokens: () => void;
  onRunDiff: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export default function MainScreen({
  tokenCount,
  settings,
  onViewTokens,
  onRunDiff,
  onRefresh,
  onOpenSettings,
}: Props) {
  return (
    <div className="screen">
      <div className="screen-header">
        <div className="header-row">
          <h1>Token Hub</h1>
          <button className="btn-icon" onClick={onOpenSettings} title="Настройки">⚙️</button>
        </div>
        <div className="status-badge connected">
          ● {settings.owner}/{settings.repo} · {settings.branch}
        </div>
      </div>

      <div className="main-content">
        <div className="token-card">
          <div className="token-card-count">{tokenCount}</div>
          <div className="token-card-label">токенов из всех коллекций</div>
          <div className="token-card-path">{settings.filePath}</div>

          <div className="token-card-actions">
            {tokenCount > 0 && (
              <button className="btn-link" onClick={onViewTokens}>
                Просмотреть →
              </button>
            )}
            <button className="btn-link" onClick={onRefresh}>
              Обновить ↺
            </button>
          </div>
        </div>
      </div>

      <div className="screen-footer">
        <button
          className="btn-primary"
          disabled={tokenCount === 0}
          onClick={onRunDiff}
        >
          Сравнить с GitHub и отправить →
        </button>
      </div>
    </div>
  );
}
