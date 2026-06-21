try {
  const mod = require('./node_modules/@next/swc-win32-arm64-msvc');
  console.log('ARM64 SWC loaded successfully!');
} catch(e) {
  console.log('ARM64 SWC FAILED:', e.message);
}

try {
  const mod = require('./node_modules/@next/swc-win32-x64-msvc');
  console.log('x64 SWC loaded successfully!');
} catch(e) {
  console.log('x64 SWC FAILED:', e.message);
}

// Check node architecture
console.log('Node arch:', process.arch);
console.log('Node version:', process.version);
