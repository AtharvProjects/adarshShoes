const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Preparing Next.js standalone build for Electron...");

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
    console.error("Error: .next/standalone does not exist. Did you run 'npm run build'?");
    process.exit(1);
}

// Copy public directory to standalone/public
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
if (fs.existsSync(publicSrc)) {
    console.log("Copying public directory...");
    fs.cpSync(publicSrc, publicDest, { recursive: true });
}

// Copy .next/static directory to standalone/.next/static
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
    console.log("Copying static directory...");
    if (!fs.existsSync(path.dirname(staticDest))) {
        fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    }
    fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// Clean better-sqlite3 from standalone node_modules to force resolution from parent
// node_modules (which is rebuilt for Electron by electron-builder during packaging)
const betterSqlite3Dir = path.join(standaloneDir, 'node_modules', 'better-sqlite3');
if (fs.existsSync(betterSqlite3Dir)) {
    console.log("Cleaning better-sqlite3 from standalone node_modules to force Electron native resolution...");
    fs.rmSync(betterSqlite3Dir, { recursive: true, force: true });
}

console.log("Next.js standalone build prepared.");

console.log("Running electron-builder...");
try {
    execSync('npx.cmd electron-builder --win --x64', { 
        stdio: 'inherit', 
        cwd: rootDir,
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=4096'
        }
    });
    console.log("Electron build completed successfully.");
} catch (error) {
    console.error("Electron builder failed:", error.message);
    process.exit(1);
}
