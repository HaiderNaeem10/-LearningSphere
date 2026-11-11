const asar = require('@electron/asar');
const path = require('path');
const fs = require('fs');

async function pack() {
  const tempDir = path.join(__dirname, 'build-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy dist
  fs.cpSync(path.join(__dirname, 'dist'), path.join(tempDir, 'dist'), { recursive: true });
  
  // Copy electron-main.js
  fs.copyFileSync(path.join(__dirname, 'electron-main.js'), path.join(tempDir, 'electron-main.js'));

  // Write minimal package.json
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'learnsphere-lms', main: 'electron-main.js' }, null, 2)
  );

  const destAsar = path.join(__dirname, 'release', 'win-unpacked', 'resources', 'app.asar');
  console.log('Packing to:', destAsar);
  
  await asar.createPackage(tempDir, destAsar);
  console.log('ASAR created successfully! Size:', fs.statSync(destAsar).size, 'bytes');

  fs.rmSync(tempDir, { recursive: true, force: true });
}

pack().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
