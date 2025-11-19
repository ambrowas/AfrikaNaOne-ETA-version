const rawFlags = import.meta.glob('../../node_modules/flagpack/flags/4x3/*.svg', {
  import: 'default',
  eager: true
});

export const flagpackMap: Record<string, string> = {};

for (const path in rawFlags) {
  const fileName = path.split('/').pop();
  if (!fileName) continue;
  const [code] = fileName.split('.');
  flagpackMap[code.toUpperCase()] = rawFlags[path] as string;
}
