const readline = require('readline');

// Checksum generation formula (must exactly match the one in src/lib/license.ts)
function generateLicenseKey(machineId) {
    let sum = 0;
    for (let i = 0; i < machineId.length; i++) {
        sum += machineId.charCodeAt(i);
    }
    
    // Hashing multiplier used in backend
    sum = (sum * 9973) % 65536;
    
    const checksum = sum.toString(16).toUpperCase().padStart(4, '0');
    
    // Format: GKS-{part1}-{part2}-{checksum}
    const part1 = machineId.substring(0, 4);
    const part2 = machineId.substring(4, 8);
    
    return `GKS-${part1}-${part2}-${checksum}`;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=========================================');
console.log('    ADARSH SHOES - LICENSE GENERATOR     ');
console.log('=========================================\n');

rl.question("Enter the customer's Hardware ID: ", (machineId) => {
    machineId = machineId.trim().toUpperCase();
    
    if (machineId.length !== 8) {
        console.error('\n[Error] Invalid Hardware ID. It must be exactly 8 characters long.');
        rl.close();
        return;
    }

    const licenseKey = generateLicenseKey(machineId);
    
    console.log('\n-----------------------------------------');
    console.log(`Hardware ID : ${machineId}`);
    console.log(`License Key : \x1b[32m${licenseKey}\x1b[0m`);
    console.log('-----------------------------------------\n');
    console.log('Give this License Key to your customer so they can activate the software.');
    
    rl.close();
});
