
/**
 * Firebase Configuration Setup
 * This file handles Firebase environment variables and configuration
 */

class FirebaseConfigManager {
    constructor() {
        this.requiredEnvVars = [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID'
        ];
        
        this.optionalEnvVars = [
            'FIREBASE_MEASUREMENT_ID',
            'FIREBASE_DATABASE_URL'
        ];
        
        this.config = {};
    }

    /**
     * Request Firebase environment variables from user
     * @returns {Promise<Object>} Firebase configuration object
     */
    async requestEnvironmentVariables() {
        console.log('🔥 Firebase Configuration Setup');
        console.log('Please provide the following Firebase environment variables:');
        console.log('');

        // Request required variables
        for (const envVar of this.requiredEnvVars) {
            const value = await this.promptUser(`${envVar} (required): `);
            if (!value.trim()) {
                throw new Error(`${envVar} is required and cannot be empty`);
            }
            this.config[envVar] = value.trim();
        }

        // Request optional variables
        console.log('\nOptional variables (press Enter to skip):');
        for (const envVar of this.optionalEnvVars) {
            const value = await this.promptUser(`${envVar} (optional): `);
            if (value.trim()) {
                this.config[envVar] = value.trim();
            }
        }

        return this.config;
    }

    /**
     * Prompt user for input
     * @param {string} question - The question to ask
     * @returns {Promise<string>} User input
     */
    promptUser(question) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    /**
     * Generate Firebase configuration object
     * @returns {Object} Firebase config object
     */
    generateFirebaseConfig() {
        return {
            apiKey: this.config.FIREBASE_API_KEY,
            authDomain: this.config.FIREBASE_AUTH_DOMAIN,
            projectId: this.config.FIREBASE_PROJECT_ID,
            storageBucket: this.config.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: this.config.FIREBASE_MESSAGING_SENDER_ID,
            appId: this.config.FIREBASE_APP_ID,
            ...(this.config.FIREBASE_MEASUREMENT_ID && { 
                measurementId: this.config.FIREBASE_MEASUREMENT_ID 
            }),
            ...(this.config.FIREBASE_DATABASE_URL && { 
                databaseURL: this.config.FIREBASE_DATABASE_URL 
            })
        };
    }

    /**
     * Generate .env file content
     * @returns {string} Environment file content
     */
    generateEnvFile() {
        let envContent = '# Firebase Configuration\n';
        
        Object.entries(this.config).forEach(([key, value]) => {
            envContent += `${key}=${value}\n`;
        });
        
        return envContent;
    }

    /**
     * Validate Firebase configuration
     * @returns {boolean} Whether configuration is valid
     */
    validateConfig() {
        const missingVars = this.requiredEnvVars.filter(
            envVar => !this.config[envVar]
        );

        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars);
            return false;
        }

        // Basic validation for common Firebase URL patterns
        const authDomain = this.config.FIREBASE_AUTH_DOMAIN;
        const projectId = this.config.FIREBASE_PROJECT_ID;
        
        if (authDomain && !authDomain.includes('.firebaseapp.com')) {
            console.warn('Warning: AUTH_DOMAIN might be invalid. Expected format: your-project.firebaseapp.com');
        }

        if (projectId && authDomain && !authDomain.includes(projectId)) {
            console.warn('Warning: PROJECT_ID and AUTH_DOMAIN might not match');
        }

        return true;
    }
}

module.exports = FirebaseConfigManager;
