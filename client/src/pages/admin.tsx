import Layout from "@/components/layout";
import FirebaseAdmin from "@/components/firebase-admin";
import FirebaseConnectionStatus from "@/components/firebase-connection-status";
import { FirebaseConfigWarning } from "@/lib/firebase-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showSimpleToast } from "@/components/simple-toast";
import { useState } from "react";

// Firebase service with fallback
import * as firebaseStub from '@/lib/firebaseService.stub';

let firebaseService: any = firebaseStub;
let hasFirebaseService = false;

// Check if Firebase is configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('your_')
);

if (hasFirebaseConfig) {
  try {
    // Import Firebase service dynamically
    import('@/lib/firebaseService').then(module => {
      firebaseService = module;
      hasFirebaseService = true;
    }).catch(error => {
      console.log('Firebase service import failed:', error);
    });
  } catch (error) {
    console.log('Firebase not configured, using fallback mode');
  }
}

export default function Admin() {
  // Using simple toast system to avoid DOM conflicts

  return (
    <Layout title="Administração" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end items-center">
          <FirebaseConnectionStatus />
        </div>

        {/* Configuration Status */}
        <FirebaseConfigWarning />

        <div className="flex justify-center">
          {/* Add Hymn Card */}
          {hasFirebaseConfig ? (
            <FirebaseAdmin />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-church-primary">
                  Adicionar Hino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Configure o Firebase para adicionar novos hinos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
