const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('1. Building Vite production bundle...');
execSync('npm run build', { stdio: 'inherit', cwd: __dirname });

console.log('2. Staging files for asar packaging...');
const stageDir = path.join(__dirname, 'build-staging');
if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Copy dist
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(path.join(__dirname, 'dist'), path.join(stageDir, 'dist'));
fs.copyFileSync(path.join(__dirname, 'electron-main.js'), path.join(stageDir, 'electron-main.js'));
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(stageDir, 'package.json'));

console.log('3. Packing asar archive...');
const outputAsar = path.join(__dirname, 'app.asar');
execSync(`npx asar pack "${stageDir}" "${outputAsar}"`, { stdio: 'inherit', cwd: __dirname });

// Copy to release directories
const targets = [
    path.join(__dirname, 'release', 'win-unpacked', 'resources', 'app.asar'),
    path.join(__dirname, 'release', 'LearnSphere-LMS-Windows-x64', 'resources', 'app.asar')
];

for (const target of targets) {
    if (fs.existsSync(path.dirname(target))) {
        fs.copyFileSync(outputAsar, target);
        console.log(`Updated: ${target}`);
    }
}

// Clean staging directory
fs.rmSync(stageDir, { recursive: true, force: true });
console.log('App packaging and deployment to desktop executables completed successfully!');
