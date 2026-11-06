// macOS without a Developer ID: sign the final universal app ad hoc so Apple silicon Macs can open it
// (unsigned arm64 code is reported as "damaged"). Runs before the .dmg is built.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  if (!context.appOutDir.endsWith('mac-universal')) return; // only the merged universal app
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], { stdio: 'inherit' });
  console.log(`  • ad-hoc signed ${app}`);
};
