import { TokenFile, TokenGroup, DesignToken, DiffEntry, DiffStatus } from '../../shared/types';

function isToken(v: unknown): v is DesignToken {
  return typeof v === 'object' && v !== null && '$value' in v;
}

export function flattenTokenFile(file: TokenFile): Record<string, DesignToken> {
  const result: Record<string, DesignToken> = {};
  for (const [collKey, group] of Object.entries(file)) {
    flattenGroup(group, collKey, result);
  }
  return result;
}

function flattenGroup(
  obj: TokenGroup | DesignToken,
  prefix: string,
  result: Record<string, DesignToken>
) {
  if (isToken(obj)) {
    result[prefix] = obj;
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    flattenGroup(value as TokenGroup | DesignToken, `${prefix}.${key}`, result);
  }
}

export function computeDiff(before: TokenFile, after: TokenFile): DiffEntry[] {
  const flatBefore = flattenTokenFile(before);
  const flatAfter = flattenTokenFile(after);
  const allKeys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);

  const entries: DiffEntry[] = [];
  for (const key of allKeys) {
    const b = flatBefore[key] ?? null;
    const a = flatAfter[key] ?? null;

    let status: DiffStatus;
    if (!b) status = 'added';
    else if (!a) status = 'removed';
    else if (String(b.$value) !== String(a.$value)) status = 'changed';
    else status = 'unchanged';

    entries.push({ key, before: b, after: a, status });
  }

  return entries.sort((a, b) => {
    const order: DiffStatus[] = ['changed', 'added', 'removed', 'unchanged'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
}

export function buildChangelog(diff: DiffEntry[]): string {
  const changed = diff.filter((d) => d.status === 'changed');
  const added = diff.filter((d) => d.status === 'added');
  const removed = diff.filter((d) => d.status === 'removed');

  const lines: string[] = [];
  if (changed.length) {
    lines.push(`### Изменено (${changed.length})`);
    changed.forEach((d) => lines.push(`- \`${d.key}\`: ${d.before?.$value} → ${d.after?.$value}`));
  }
  if (added.length) {
    lines.push(`### Добавлено (${added.length})`);
    added.forEach((d) => lines.push(`- \`${d.key}\`: ${d.after?.$value}`));
  }
  if (removed.length) {
    lines.push(`### Удалено (${removed.length})`);
    removed.forEach((d) => lines.push(`- \`${d.key}\``));
  }
  return lines.join('\n');
}
