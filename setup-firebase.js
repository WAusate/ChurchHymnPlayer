
#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Interactive script to configure Firebase environment variables
 */

const fs = require('fs');
const path = require('path');
const FirebaseConfigManager = require('./firebase-config');

async function main() {
    try {
        const configManager = new FirebaseConfigManager();
        
        console.log('🚀 Starting Firebase configuration setup...\n');
        
        // Request environment variables from user
        await configManager.requestEnvironmentVariables();
        
        // Validate configuration
        if (!configManager.validateConfig()) {
            console.error('❌ Configuration validation failed. Please check your inputs.');
            process.exit(1);
        }
        
        // Generate Firebase config object
        const firebaseConfig = configManager.generateFirebaseConfig();
        
        // Generate .env file content
        const envContent = configManager.generateEnvFile();
        
        // Write .env file
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file created successfully');
        
        // Write Firebase config to JSON file
        fs.writeFileSync('firebase-config.json', JSON.stringify(firebaseConfig, null, 2));
        console.log('✅ firebase-config.json created successfully');
        
        // Generate JavaScript config file
        const jsConfigContent = `// Firebase Configuration
// This file is auto-generated. Do not edit manually.

const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

export default firebaseConfig;
`;
        
        fs.writeFileSync('firebase-config-export.js', jsConfigContent);
        console.log('✅ firebase-config-export.js created successfully');
        
        console.log('\n🎉 Firebase configuration setup completed!');
        console.log('\nGenerated files:');
        console.log('- .env (environment variables)');
        console.log('- firebase-config.json (JSON configuration)');
        console.log('- firebase-config-export.js (JavaScript export)');
        console.log('\n⚠️  Remember to add .env to your .gitignore file!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = main;
