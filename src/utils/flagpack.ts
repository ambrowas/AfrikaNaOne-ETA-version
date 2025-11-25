import { countryData } from './countryData';

const rawFlags = import.meta.glob('../../node_modules/flagpack/flags/4x3/*.svg', {
  import: 'default',
  eager: true
});

export const flagpackMap: Record<string, string> = {};

const registerFlag = (code: string, src: string) => {
  flagpackMap[code] = src;
  flagpackMap[code.toLowerCase()] = src;
};

for (const path in rawFlags) {
  const fileName = path.split('/').pop();
  if (!fileName) continue;
  const [code] = fileName.split('.');
  registerFlag(code.toUpperCase(), rawFlags[path] as string);
}

// Convert a flag emoji into its ISO2 country code (e.g. 🇰🇪 -> KE)
const flagEmojiToIso2 = (flag: string) => {
  if (!flag) return undefined;
  const indicators = Array.from(flag).filter((char) => {
    const point = char.codePointAt(0);
    return !!point && point >= 0x1f1e6 && point <= 0x1f1ff;
  });
  if (indicators.length < 2) return undefined;

  const base = 0x1f1e6;
  const toChar = (char: string) => {
    const point = char.codePointAt(0);
    if (point === undefined) return undefined;
    return String.fromCharCode(point - base + 65);
  };

  const first = toChar(indicators[0]);
  const second = toChar(indicators[1]);
  if (!first || !second) return undefined;

  return `${first}${second}`;
};

// Add ISO3 lookups so our country data can resolve to flagpack assets
for (const country of countryData) {
  const iso2 = flagEmojiToIso2(country.flag);
  if (!iso2) continue;
  const src = flagpackMap[iso2.toUpperCase()];
  if (!src) continue;
  registerFlag(country.iso3, src);
}
