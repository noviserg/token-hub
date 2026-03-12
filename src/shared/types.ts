// W3C DTCG token leaf
export interface DesignToken {
  $type: 'color' | 'number' | 'string' | 'boolean';
  $value: string | number | boolean;
}

// Nested group: either sub-group or a leaf token
export type TokenGroup = {
  [key: string]: TokenGroup | DesignToken;
};

// Full file: top-level keys are "collectionName/modeName"
export type TokenFile = Record<string, TokenGroup>;

// Messages: Plugin Sandbox ↔ UI
export type PluginMessage =
  | { type: 'GET_ALL_TOKENS' }
  | { type: 'ALL_TOKENS_RESULT'; tokens: TokenFile }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS_RESULT'; settings: Settings }
  | { type: 'SAVE_SETTINGS'; settings: Settings }
  | { type: 'ERROR'; message: string };

export interface Settings {
  pat: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

// Diff (works on flattened keys)
export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  before: DesignToken | null;
  after: DesignToken | null;
  status: DiffStatus;
}
