import fs from 'fs';
import https from 'https';
import path from 'path';

const PROJECT_ID = 'app-hinos';
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

// Firebase Management API endpoint
const FIREBASE_API_BASE = 'https://firebase.googleapis.com/v1beta1';

async function deployToFirebase() {
  console.log('🚀 Starting Firebase Hosting deployment via API...');
  
  if (!API_KEY) {
    console.error('❌ Firebase API key not found in environment variables');
    return;
  }

  try {
    // Create a version for the site
    const versionData = {
      config: {
        rewrites: [
          {
            glob: '**',
            path: '/index.html'
          }
        ]
      }
    };

    console.log('📦 Creating hosting version...');
    
    // This approach requires Firebase Admin SDK with proper service account
    // For now, we'll provide the manual deployment instructions
    console.log('⚠️  API deployment requires service account credentials');
    console.log('📋 Using manual deployment approach instead...');
    
    // List the files that need to be deployed
    const publicDir = './dist/public';
    const files = getAllFiles(publicDir);
    
    console.log('📁 Files ready for deployment:');
    files.forEach(file => {
      const relativePath = path.relative(publicDir, file);
      console.log(`  ✓ ${relativePath}`);
    });
    
    console.log('');
    console.log('🔗 Manual deployment steps:');
    console.log('1. Visit: https://console.firebase.google.com/project/app-hinos/hosting');
    console.log('2. Click "Deploy"');
    console.log('3. Upload files from dist/public/ directory');
    console.log('4. Wait for deployment to complete');
    console.log('');
    console.log('🎯 After deployment, test at:');
    console.log('   https://app-hinos.web.app');
    console.log('   https://app-hinos.firebaseapp.com');
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

deployToFirebase();