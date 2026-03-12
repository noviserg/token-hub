import { DesignToken, TokenFile, TokenGroup } from '../shared/types';

export function getAllTokens(): TokenFile {
  const collections = figma.variables.getLocalVariableCollections();
  const result: TokenFile = {};

  for (const collection of collections) {
    for (const mode of collection.modes) {
      const key = `${collection.name}/${mode.name}`;
      const group: TokenGroup = {};

      for (const varId of collection.variableIds) {
        const variable = figma.variables.getVariableById(varId);
        if (!variable) continue;

        const value = variable.valuesByMode[mode.modeId];
        if (value === undefined) continue;

        const token = toDesignToken(variable, value);
        if (!token) continue;

        const parts = variable.name.split('/').map((p) => p.trim());
        setNested(group, parts, token);
      }

      result[key] = group;
    }
  }

  return result;
}

function setNested(obj: TokenGroup, path: string[], value: DesignToken) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) current[path[i]] = {} as TokenGroup;
    current = current[path[i]] as TokenGroup;
  }
  current[path[path.length - 1]] = value;
}

function toDesignToken(variable: Variable, value: VariableValue): DesignToken | null {
  if (isAlias(value)) {
    const alias = figma.variables.getVariableById(value.id);
    if (!alias) return null;
    const aliasPath = alias.name.split('/').map((p) => p.trim()).join('.');
    return {
      $type: figmaTypeToW3C(variable.resolvedType),
      $value: `{${aliasPath}}`,
    };
  }

  switch (variable.resolvedType) {
    case 'COLOR': {
      const c = value as RGBA;
      return { $type: 'color', $value: rgbaToHex(c) };
    }
    case 'FLOAT':
      return { $type: 'number', $value: value as number };
    case 'STRING':
      return { $type: 'string', $value: value as string };
    case 'BOOLEAN':
      return { $type: 'boolean', $value: value as boolean };
    default:
      return null;
  }
}

function isAlias(value: VariableValue): value is VariableAlias {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as VariableAlias).type === 'VARIABLE_ALIAS'
  );
}

function figmaTypeToW3C(type: VariableResolvedDataType): DesignToken['$type'] {
  switch (type) {
    case 'COLOR': return 'color';
    case 'FLOAT': return 'number';
    case 'STRING': return 'string';
    case 'BOOLEAN': return 'boolean';
  }
}

function rgbaToHex({ r, g, b, a }: RGBA): string {
  const hex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return a < 1
    ? `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`
    : `#${hex(r)}${hex(g)}${hex(b)}`;
}
