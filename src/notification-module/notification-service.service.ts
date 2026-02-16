import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FCM_FIREBASE_CONFIG } from '../config/fcm.config';

const BetterQueue = require('better-queue');

@Injectable()
export class NotificationService {
  private notificationQueue: any;

  constructor(private readonly firebaseService: FirebaseService) {
    console.log('Initializing NotificationService with BetterQueue...');
    this.notificationQueue = new BetterQueue(
      async (input, cb) => {
        try {
          console.log('Queue worker received job:', {
            hasValue: !!input.value,
            valueLength: input.value?.length,
            hasBody: !!input.body,
            bodyKeys: input.body ? Object.keys(input.body) : []
          });
          
          const payload = input.body || {};
          const title = payload.title || payload.notification?.title || 'Notification';
          const body = payload.body || payload.notification?.body || payload.message || '';
          const deviceid = input.value;
          
          console.log('Parsed notification data:', {
            title,
            body,
            deviceidLength: deviceid?.length,
            deviceidPreview: deviceid?.substring(0, 20) + '...'
          });
          
          if (!deviceid) {
            throw new Error('Device token is required');
          }
          
          if (!title || !body) {
            throw new Error(`Missing notification content - title: ${!!title}, body: ${!!body}`);
          }
          
          const message = {
            notification: {
              title,
              body,
            },
            token: deviceid,
          };
          
          console.log('Calling sendPushWithRetry with message...');
          await this.sendPushWithRetry(message);
          console.log('Queue job completed successfully');
          cb(null, 'Job completed');
        } catch (error) {
          console.error('Queue worker error:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
            fullError: error
          });
          cb(error);
        }
      },
      {
        store: {
          type: 'memory',
        },
        maxRetries: 2,
        retryDelay: 1000,
        concurrent: 1,
      },
    );
  }

  async sendNotification(deviceToken: String[], payload: any) {
    console.log('dd', deviceToken)
    const body = payload;
    deviceToken.forEach((value, index) => {
      this.notificationQueue.push({ value, body });
    });
  }
  async sendPushWithRetry(message, attempt = 1) {
    try {
      console.log(`[Attempt ${attempt}] Sending push notification to token: ${message.token?.substring(0, 20)}...`);
      console.log(`[Attempt ${attempt}] Message payload:`, JSON.stringify({
        title: message.notification?.title,
        body: message.notification?.body,
        hasToken: !!message.token,
        tokenLength: message.token?.length
      }));
      
      await this.sendPush(message);
      console.log(`[Attempt ${attempt}] Push notification sent successfully`);
    } catch (error) {
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || 'UNKNOWN';
      const errorStack = error?.stack || '';
      
      console.error(`[Attempt ${attempt}] Error sending push notification:`);
      console.error(`  - Error Code: ${errorCode}`);
      console.error(`  - Error Message: ${errorMessage}`);
      console.error(`  - Full Error:`, error);
      
      if (errorStack) {
        console.error(`  - Stack Trace:`, errorStack);
      }
      
      if (attempt <= 2) {
        console.log(`[Attempt ${attempt}] Retrying in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); 
        await this.sendPushWithRetry(message, attempt + 1); 
      } else {
        console.error(`[Attempt ${attempt}] Maximum number of retries reached. Giving up.`);
        throw error; // Re-throw after max retries
      }
    }
  }

  async sendPush(message) {
    try {
      // Validate message structure
      if (!message.token) {
        throw new Error('FCM token is missing from message');
      }
      
      if (!message.notification || !message.notification.title || !message.notification.body) {
        throw new Error('Notification title or body is missing');
      }
      
      // Check Firebase Admin is initialized
      const firebaseAdmin = this.firebaseService.getFirebaseAdmin();
      if (!firebaseAdmin) {
        throw new Error('Firebase Admin is not initialized');
      }
      
      console.log('Calling Firebase messaging.send()...');
      const result = await firebaseAdmin.messaging().send(message);
      console.log('Firebase messaging.send() result:', result);
      return result;
    } catch (error) {
      const errorCode = error?.code;
      const errorMessage = error?.message;
      
      // Handle SenderId mismatch specifically
      if (errorCode === 'messaging/mismatched-credential') {
        console.error('❌ SENDERID MISMATCH ERROR DETECTED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('The FCM token was generated for a different Firebase project.');
        console.error('');
        // console.error('Current Service Account Project:', FCM_FIREBASE_CONFIG?.project_id || 'Unknown');
        console.error('FCM Token (first 50 chars):', message.token?.substring(0, 50) + '...');
        console.error('');
        console.error('SOLUTIONS:');
        console.error('1. Ensure the mobile app uses the same Firebase project as the service account');
        console.error('2. Update the service account to match the mobile app\'s Firebase project');
        console.error('3. Regenerate FCM tokens from the mobile app after fixing the project mismatch');
        console.error('═══════════════════════════════════════════════════════');
      }
      
      console.error('sendPush() error details:', {
        code: errorCode,
        message: errorMessage,
        errorInfo: error?.errorInfo,
        stack: error?.stack
      });
      throw error; 
    }
  }
}
