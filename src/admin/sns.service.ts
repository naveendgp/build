/**
 * SnsService — AWS SNS SMS delivery
 * 
 * Publishes SMS messages via AWS SNS.
 * NEVER logs the OTP value — only sends it.
 */

import { Injectable } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class SnsService {
    private readonly client: SNSClient;

    constructor() {
        this.client = new SNSClient({
            region: process.env.AWS_REGION || 'ap-south-1',
            // AWS credentials from environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
            // or IAM role if running on EC2/ECS
        });
    }

    /**
     * Send an SMS message to a phone number.
     * @param phoneNumber E.164 format, e.g. "+919876543210"
     * @param message The SMS body (contains OTP — NEVER log this)
     */
    async sendSms(phoneNumber: string, message: string): Promise<void> {
        const cmd = new PublishCommand({
            PhoneNumber: phoneNumber,
            Message: message,
            MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional',
                },
            },
        });

        try {
            await this.client.send(cmd);
            // Log delivery attempt (NOT the message content)
            console.log(`[SNS] SMS sent to ${phoneNumber.slice(0, -4)}****`);
        } catch (error) {
            console.error(`[SNS] Failed to send SMS to ${phoneNumber.slice(0, -4)}****:`, error?.message);
            throw new Error('SMS delivery failed');
        }
    }
}
