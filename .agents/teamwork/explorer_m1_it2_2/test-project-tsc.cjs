const ts = require('typescript');
const fs = require('fs');

let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace('{ hasError: boolean error: Error | null }', '{ hasError: boolean; error: Error | null }');
appCode = appCode.replace('{ children: React.ReactNode onReset: () => void }', '{ children: React.ReactNode; onReset: () => void }');
appCode = appCode.replace('androidHardwareAccelerationDisabled={false}', '// @ts-ignore\n          androidHardwareAccelerationDisabled={false}');

let viteCode = fs.readFileSync('vite.config.ts', 'utf8');
viteCode = viteCode.replace('this.emitFile({', '(this as any).emitFile({');

let envCode = fs.readFileSync('src/vite-env.d.ts', 'utf8');
envCode += `
import 'react-native';
declare module 'react-native' {
  namespace StyleSheet {
    export const absoluteFillObject: any;
  }
}
`;

const readConfig = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(readConfig.config, ts.sys, './');

const options = {
  ...parsed.options,
  skipLibCheck: true
};

const host = ts.createCompilerHost(options);
const origGetSourceFile = host.getSourceFile;
host.getSourceFile = (fileName, languageVersion) => {
  if (fileName === 'App.tsx' || fileName.endsWith('/App.tsx') || fileName.endsWith('\\App.tsx')) {
    return ts.createSourceFile(fileName, appCode, languageVersion, true);
  }
  if (fileName === 'vite.config.ts' || fileName.endsWith('/vite.config.ts') || fileName.endsWith('\\vite.config.ts')) {
    return ts.createSourceFile(fileName, viteCode, languageVersion, true);
  }
  if (fileName.endsWith('vite-env.d.ts')) {
    return ts.createSourceFile(fileName, envCode, languageVersion, true);
  }
  return origGetSourceFile(fileName, languageVersion);
};

const filesToTest = [...parsed.fileNames, 'App.tsx'];
const program = ts.createProgram(filesToTest, options, host);

let totalErrors = 0;
for (const file of filesToTest) {
  const sf = program.getSourceFile(file);
  if (!sf) {
    console.log('File not found:', file);
    continue;
  }
  const diags = program.getSemanticDiagnostics(sf);
  console.log(file, '->', diags.length, 'diags');
  for (const d of diags) {
    totalErrors++;
    const pos = sf.getLineAndCharacterOfPosition(d.start);
    console.log('  Line ' + (pos.line + 1) + ':' + (pos.character + 1) + ' - ' + (typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText));
  }
}

console.log('TOTAL PROJECT ERRORS:', totalErrors);
