const ts = require('typescript');
const fs = require('fs');

let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace('{ hasError: boolean error: Error | null }', '{ hasError: boolean; error: Error | null }');
appCode = appCode.replace('{ children: React.ReactNode onReset: () => void }', '{ children: React.ReactNode; onReset: () => void }');
appCode = appCode.replace('androidHardwareAccelerationDisabled={false}', '// @ts-ignore\n          androidHardwareAccelerationDisabled={false}');

const dtsCode = `
import 'react-native';
declare module 'react-native' {
  namespace StyleSheet {
    export const absoluteFillObject: any;
  }
}
`;

const options = {
  target: ts.ScriptTarget.ES2020,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true
};

const host = ts.createCompilerHost(options);
const origGetSourceFile = host.getSourceFile;
host.getSourceFile = (fileName, languageVersion) => {
  if (fileName === 'App.tsx' || fileName.endsWith('/App.tsx') || fileName.endsWith('\\App.tsx')) {
    return ts.createSourceFile(fileName, appCode, languageVersion, true);
  }
  if (fileName === 'augment.d.ts' || fileName.endsWith('augment.d.ts')) {
    return ts.createSourceFile(fileName, dtsCode, languageVersion, true);
  }
  return origGetSourceFile(fileName, languageVersion);
};

const program = ts.createProgram(['App.tsx', 'augment.d.ts'], options, host);
const sf = program.getSourceFile('App.tsx');
const diags = program.getSemanticDiagnostics(sf);
console.log('App.tsx diags with @ts-ignore:', diags.length);
for (const d of diags) {
  console.log('-', typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText);
}
