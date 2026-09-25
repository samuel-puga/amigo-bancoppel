const ts = require('typescript');
const fs = require('fs');

const readConfig = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(readConfig.config, ts.sys, './');

const options = {
  ...parsed.options,
  skipLibCheck: true
};

const program = ts.createProgram(['src-mobile/generated/webAppHtml.ts'], options);
const sf = program.getSourceFile('src-mobile/generated/webAppHtml.ts');
if (sf) {
  const diags = program.getSemanticDiagnostics(sf);
  console.log('webAppHtml.ts diags:', diags.length);
  for (const d of diags) console.log(d.messageText);
} else {
  console.log('webAppHtml.ts not found in program');
}
