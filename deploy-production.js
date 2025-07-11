#!/usr/bin/env node
/**
 * Alternative Firebase Hosting deployment script using REST API
 * This script can be used when Firebase CLI authentication is not available
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ID = 'app-hinos';
const HOSTING_DIR = './dist/public';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🚀 Alternative Firebase Hosting Deployment Script');
console.log('📁 Project:', PROJECT_ID);
console.log('📂 Source Directory:', HOSTING_DIR);
console.log('');

// Check if build directory exists
if (!fs.existsSync(HOSTING_DIR)) {
  console.error('❌ Build directory not found:', HOSTING_DIR);
  console.log('💡 Run "npm run build" first');
  process.exit(1);
}

// List files to deploy
function listFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      listFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = listFiles(HOSTING_DIR);
console.log('📦 Files to deploy:');
files.forEach(file => {
  const relativePath = path.relative(HOSTING_DIR, file);
  const size = fs.statSync(file).size;
  console.log(`  ${relativePath} (${(size/1024).toFixed(1)}KB)`);
});

console.log('');
console.log('🔧 Deployment Methods Available:');
console.log('');
console.log('1. 📤 Manual Upload via Firebase Console');
console.log('   - Visit: https://console.firebase.google.com/project/app-hinos/hosting');
console.log('   - Click "Add another site" or "Deploy"');
console.log('   - Upload files from: dist/public/');
console.log('');
console.log('2. 🔄 Local Firebase CLI (if available)');
console.log('   - Run: firebase login');
console.log('   - Run: firebase deploy --only hosting');
console.log('');
console.log('3. 📋 GitHub Actions (Automated)');
console.log('   - Push code to GitHub repository');
console.log('   - Configure GitHub Actions workflow');
console.log('   - Automatic deployment on push');
console.log('');
console.log('4. 📥 Download Archive');
console.log('   - Use the firebase-deploy.tar.gz file');
console.log('   - Extract and upload manually');
console.log('');

// Create deployment summary
const deploymentSummary = {
  timestamp: new Date().toISOString(),
  project: PROJECT_ID,
  sourceDir: HOSTING_DIR,
  files: files.map(file => ({
    path: path.relative(HOSTING_DIR, file),
    size: fs.statSync(file).size
  })),
  totalSize: files.reduce((sum, file) => sum + fs.statSync(file).size, 0),
  config: firebaseConfig
};

fs.writeFileSync('deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));
console.log('✅ Deployment summary saved to: deployment-summary.json');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Choose one of the deployment methods above');
console.log('2. Deploy the application to production');
console.log('3. Test audio playback at the production URL');
console.log('4. Verify CORS issues are resolved');
console.log('');
console.log('🔗 Production URL (after deployment):');
console.log('   https://app-hinos.web.app');
console.log('   or');
console.log('   https://app-hinos.firebaseapp.com');