/**
 * Seed Questions Runner
 * 
 * This script runs the seed questions function.
 * Make sure you have Firebase Admin credentials configured.
 * 
 * Run with: npx tsx scripts/seed-questions-runner.ts
 */

import * as admin from 'firebase-admin';
import { seedQuestions } from './seed-questions';

// Initialize Firebase Admin
// Option 1: Use service account file
// const serviceAccount = require('../path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use environment variable (recommended for CI/CD)
// Set GOOGLE_APPLICATION_CREDENTIALS environment variable
// Or use default credentials if running on GCP

// Option 3: Use Firebase CLI credentials (if logged in)
// Just initialize without credentials - it will use default
try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error);
  console.log('\n💡 Make sure you:');
  console.log('   1. Are logged in with: firebase login');
  console.log('   2. Or have GOOGLE_APPLICATION_CREDENTIALS set');
  console.log('   3. Or have a service account key file');
  process.exit(1);
}

// Run the seed function
seedQuestions()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
