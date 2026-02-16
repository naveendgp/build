// firebase.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FCM_FIREBASE_CONFIG } from '../config/fcm.config';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly firebaseAdmin: admin.app.App;

  constructor() {
    try {
      this.logger.log('Initializing Firebase Admin SDK...');
      
      // Check if config exists
      if (!FCM_FIREBASE_CONFIG) {
        throw new Error('FCM_FIREBASE_CONFIG is not defined');
      }
      
      
      
      const firebaseApps = admin.apps;
      if (firebaseApps.length === 0) {
        this.logger.log('No existing Firebase apps found, initializing new app...');
        this.firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(FCM_FIREBASE_CONFIG as admin.ServiceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.log(`Found ${firebaseApps.length} existing Firebase app(s), reusing...`);
        this.firebaseAdmin = firebaseApps[0];
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.logger.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      throw error;
    }
  }

  getFirebaseAdmin(): admin.app.App {
    if (!this.firebaseAdmin) {
      this.logger.error('Firebase Admin not initialized');
      throw new Error('Firebase Admin not initialized');
    }
    return this.firebaseAdmin;
  }
}
