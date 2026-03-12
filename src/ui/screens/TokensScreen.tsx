import React, { useState } from 'react';
import { TokenFile, DesignToken } from '../../shared/types';
import { flattenTokenFile } from '../services/diff';

interface Props {
  tokens: TokenFile;
  onBack: () => void;
}

export default function TokensScreen({ tokens, onBack }: Props) {
  const [search, setSearch] = useState('');
  const flat = flattenTokenFile(tokens);
  const entries = Object.entries(flat).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="header-row">
          <button className="btn-back" onClick={onBack}>←</button>
          <h1>Токены</h1>
          <span className="count-badge">{entries.length}</span>
        </div>
        <input
          className="search"
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="token-list">
        {entries.map(([key, token]) => (
          <TokenRow key={key} path={key} token={token} />
        ))}
        {entries.length === 0 && <p className="empty">Ничего не найдено</p>}
      </div>
    </div>
  );
}

function TokenRow({ path, token }: { path: string; token: DesignToken }) {
  const parts = path.split('.');
  const name = parts[parts.length - 1];
  const group = parts.slice(0, -1).join('.');

  return (
    <div className="token-row">
      <div className="token-meta">
        <div className="token-group">{group}</div>
        <div className="token-name">{name}</div>
      </div>
      <div className="token-value">
        {token.$type === 'color' && isHex(String(token.$value)) && (
          <span className="color-swatch" style={{ background: String(token.$value) }} />
        )}
        <span className="token-val-text">{String(token.$value)}</span>
      </div>
    </div>
  );
}

function isHex(v: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(v);
}
