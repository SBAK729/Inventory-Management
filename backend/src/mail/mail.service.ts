import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false, // false for port 587 (STARTTLS); Gmail requires this
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to,
        subject: 'OTech Inventory — Password Reset Request',
        html: `
          <p>You requested a password reset for your OTech Inventory account.</p>
          <p><a href="${resetLink}">Click here to reset your password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (err) {
      // Don't let an SMTP failure crash the request — log it and let the
      // caller decide how to respond (forgot-password still returns a
      // generic success message either way, to avoid leaking account info).
      this.logger.error('Failed to send password reset email', err);
    }
  }
}