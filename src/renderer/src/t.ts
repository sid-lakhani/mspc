import { DEFAULT_GOD_NAME } from '@shared/godIdentity';
import stringsData from './strings.json';

function flatten(obj: any, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      Object.assign(result, flatten(val, newKey));
    } else {
      result[newKey] = val;
    }
  }
  return result;
}
const flatStrings = flatten(stringsData);

export function t(key: string, args?: Record<string, any>): string {
  let str = flatStrings[key];
  if (!str) return key;

  str = str.replace(/{{godName}}/g, DEFAULT_GOD_NAME);

  if (args) {
    for (const [k, v] of Object.entries(args)) {
      str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
    }
  }
  return str;
}

export type TFunction = (key: string, options?: any) => string;

export const i18n = { language: 'en' };
