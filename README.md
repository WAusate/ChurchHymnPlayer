
# Firebase Configuration Setup

This project provides an interactive setup system for Firebase environment variables.

## Features

- Interactive command-line interface to collect Firebase configuration
- Validates required and optional environment variables
- Generates multiple configuration file formats
- Creates `.env` file for environment variables
- Exports JavaScript configuration object

## Required Environment Variables

The following variables are required for Firebase configuration:

- `FIREBASE_API_KEY` - Your Firebase API key
- `FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain (usually `your-project.firebaseapp.com`)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `FIREBASE_APP_ID` - Your Firebase app ID

## Optional Environment Variables

- `FIREBASE_MEASUREMENT_ID` - Google Analytics measurement ID
- `FIREBASE_DATABASE_URL` - Realtime Database URL

## Usage

### Interactive Setup

Run the interactive setup script:

```bash
npm run setup
```

or

```bash
node setup-firebase.js
```

### Manual Configuration

You can also use the FirebaseConfigManager class directly:

```javascript
const FirebaseConfigManager = require('./firebase-config');

async function setupFirebase() {
    const configManager = new FirebaseConfigManager();
    
    // Request variables interactively
    await configManager.requestEnvironmentVariables();
    
    // Validate configuration
    if (configManager.validateConfig()) {
        // Generate Firebase config
        const firebaseConfig = configManager.generateFirebaseConfig();
        console.log('Firebase config ready:', firebaseConfig);
    }
}

setupFirebase();
```

## Generated Files

After running the setup, the following files will be created:

1. **`.env`** - Environment variables file
2. **`firebase-config.json`** - JSON configuration file
3. **`firebase-config-export.js`** - JavaScript export file

## Security Note

⚠️ **Important**: Make sure to add `.env` to your `.gitignore` file to prevent committing sensitive Firebase credentials to version control.

## Installation

```bash
npm install
```

## Scripts

- `npm run setup` - Run the interactive Firebase setup
- `npm run validate` - Validate existing configuration

## Example Output

```
🔥 Firebase Configuration Setup
Please provide the following Firebase environment variables:

FIREBASE_API_KEY (required): your-api-key-here
FIREBASE_AUTH_DOMAIN (required): your-project.firebaseapp.com
FIREBASE_PROJECT_ID (required): your-project-id
FIREBASE_STORAGE_BUCKET (required): your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID (required): 123456789
FIREBASE_APP_ID (required): 1:123456789:web:abcdef

Optional variables (press Enter to skip):
FIREBASE_MEASUREMENT_ID (optional): G-XXXXXXXXXX
FIREBASE_DATABASE_URL (optional): 

✅ .env file created successfully
✅ firebase-config.json created successfully
✅ firebase-config-export.js created successfully

🎉 Firebase configuration setup completed!
```

## License

MIT
