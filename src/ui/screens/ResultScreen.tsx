import React from 'react';
import { DiffEntry } from '../../shared/types';

interface Props {
  url: string;
  type: 'commit' | 'pr';
  diff: DiffEntry[];
  onDone: () => void;
}

export default function ResultScreen({ url, type, diff, onDone }: Props) {
  const changed = diff.filter((d) => d.status === 'changed').length;
  const added = diff.filter((d) => d.status === 'added').length;
  const removed = diff.filter((d) => d.status === 'removed').length;

  return (
    <div className="screen result-screen">
      <div className="result-icon">✅</div>
      <h1>{type === 'pr' ? 'Pull Request создан' : 'Коммит отправлен'}</h1>

      <div className="result-summary">
        {changed > 0 && <span className="badge changed">{changed} изменено</span>}
        {added > 0 && <span className="badge added">{added} добавлено</span>}
        {removed > 0 && <span className="badge removed">{removed} удалено</span>}
      </div>

      <a className="result-link" href={url} target="_blank" rel="noreferrer">
        Открыть на GitHub →
      </a>

      <div className="screen-footer">
        <button className="btn-secondary" onClick={onDone}>
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}
