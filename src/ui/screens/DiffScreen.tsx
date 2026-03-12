import React, { useState } from 'react';
import { DiffEntry, DiffStatus } from '../../shared/types';

interface Props {
  diff: DiffEntry[];
  onBack: () => void;
  onConfirm: () => void;
}

const STATUS_LABEL: Record<DiffStatus, string> = {
  changed: '✏️ Изменён',
  added: '✅ Добавлен',
  removed: '🗑️ Удалён',
  unchanged: '— Без изменений',
};

const STATUS_CLASS: Record<DiffStatus, string> = {
  changed: 'changed',
  added: 'added',
  removed: 'removed',
  unchanged: 'unchanged',
};

export default function DiffScreen({ diff, onBack, onConfirm }: Props) {
  const [filter, setFilter] = useState<DiffStatus | 'all'>('all');

  const hasChanges = diff.some((d) => d.status !== 'unchanged');
  const visible = filter === 'all' ? diff.filter((d) => d.status !== 'unchanged') : diff.filter((d) => d.status === filter);

  const counts = {
    changed: diff.filter((d) => d.status === 'changed').length,
    added: diff.filter((d) => d.status === 'added').length,
    removed: diff.filter((d) => d.status === 'removed').length,
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="header-row">
          <button className="btn-back" onClick={onBack}>←</button>
          <h1>Изменения</h1>
        </div>

        {hasChanges ? (
          <div className="diff-summary">
            {counts.changed > 0 && <span className="badge changed">{counts.changed} изменено</span>}
            {counts.added > 0 && <span className="badge added">{counts.added} добавлено</span>}
            {counts.removed > 0 && <span className="badge removed">{counts.removed} удалено</span>}
          </div>
        ) : (
          <p className="no-changes">Токены актуальны</p>
        )}

        {hasChanges && (
          <div className="filter-tabs">
            {(['all', 'changed', 'added', 'removed'] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Все' : STATUS_LABEL[f].split(' ')[1]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="diff-list">
        {visible.map((entry) => (
          <div key={entry.key} className={`diff-row ${STATUS_CLASS[entry.status]}`}>
            <div className="diff-key">{entry.key}</div>
            <div className="diff-values">
              {entry.before && (
                <span className="diff-before">
                  {entry.before.$type === 'color' && (
                    <span className="color-swatch" style={{ background: String(entry.before.$value) }} />
                  )}
                  {String(entry.before.$value)}
                </span>
              )}
              {entry.status === 'changed' && <span className="diff-arrow">→</span>}
              {entry.after && (
                <span className="diff-after">
                  {entry.after.$type === 'color' && (
                    <span className="color-swatch" style={{ background: String(entry.after.$value) }} />
                  )}
                  {String(entry.after.$value)}
                </span>
              )}
            </div>
            <span className={`diff-status ${STATUS_CLASS[entry.status]}`}>
              {STATUS_LABEL[entry.status]}
            </span>
          </div>
        ))}
        {visible.length === 0 && hasChanges && <p className="empty">Нет записей по фильтру</p>}
      </div>

      {hasChanges && (
        <div className="screen-footer">
          <button className="btn-primary" onClick={onConfirm}>
            Отправить в GitHub →
          </button>
        </div>
      )}
    </div>
  );
}
