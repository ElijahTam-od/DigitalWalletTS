import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/config';
import logger from '../utils/logger';
import User from '../model/user.model';
import { promises as fs } from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import UserModel from "../model/user.model";

interface EmailTemplateContext {
	[key: string]: any;
}

class NotificationService {
	private transporter: Transporter;
	private templates: { [key: string]: HandlebarsTemplateDelegate };
	private baseTemplate!: HandlebarsTemplateDelegate;

	constructor() {
		this.transporter = this.createTransporter();
		this.templates = {};
		this.loadEmailTemplates();
		Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
	}

	private createTransporter(): Transporter {
		logger.info('Using MailHog for email testing');
		return nodemailer.createTransport({
			host: 'localhost',
			port: 1025,
			ignoreTLS: true,
		});
	}

	private async loadEmailTemplates(): Promise<void> {
		try {
			const templateDir = path.join(__dirname, '../templates');
			const baseTemplate = await fs.readFile(path.join(templateDir, 'base-email-template.html'), 'utf-8');
			this.baseTemplate = Handlebars.compile(baseTemplate);

			const templateFiles = [
				'verification',
				'login',
				'deposit',
				'kyc-verification',
				'qr-payment',
				'transfer',
				'withdrawal',
				'wallet-creation',
				'payment-method-added',
			];

			for (const file of templateFiles) {
				const templatePath = path.join(templateDir, `${file}-email-template.html`);
				const templateContent = await fs.readFile(templatePath, 'utf-8');
				this.templates[file] = Handlebars.compile(templateContent);
			}
			logger.info('Email templates loaded successfully');
			logger.debug('Loaded templates:', Object.keys(this.templates));
		} catch (error) {
			const typedError = error as Error;
			logger.error('Error loading email templates:', typedError);
			throw new Error(`Failed to load email templates: ${typedError.message}`);
		}
	}

	public async sendEmail(to: string, subject: string, templateName: string, context: EmailTemplateContext): Promise<void> {
		try {
			if (!this.templates[templateName]) {
				logger.error(`Template '${templateName}' not found. Available templates:`, Object.keys(this.templates));
				throw new Error(`Email template '${templateName}' not found`);
			}

			logger.debug(`Rendering template: ${templateName}`);
			logger.debug('Template context:', context);

			const template = this.templates[templateName];
			const content = template(context);
			const html = this.baseTemplate({ content, subject, ...context });

			const mailOptions = {
				from: 'Your E-Wallet <noreply@coderstudio.co>',
				to,
				subject,
				html,
			};

			logger.debug('Mail options:', mailOptions);

			await this.transporter.sendMail(mailOptions);
			logger.info(`Email sent to ${to} using template ${templateName}`);

			if (process.env.USE_MAILHOG === 'true') {
				logger.info('MailHog Web Interface: http://localhost:8025');
				logger.info('Check MailHog to view the sent email.');
			}
		} catch (error) {
			const typedError = error as Error;
			logger.error('Error sending email:', typedError);
			logger.error('Template name:', templateName);
			logger.error('Context:', context);
			throw new Error(`Failed to send email notification: ${typedError.message}`);
		}
	}

	public async notifyEmailVerification(user: InstanceType<typeof UserModel>, verificationLink: string): Promise<boolean> {
		try {
			await this.sendEmail(
				user.email,
				'Verify Your E-Wallet Email',
				'verification',
				{
					firstName: user.firstName,
					verificationLink,
				}
			);
			logger.info(`Verification email sent successfully to ${user.email}`);
			return true;
		} catch (error) {
			logger.error(`Error sending verification email to ${user.email}:`, error);
			return false;
		}
	}

	// Implement other notification methods here, similar to notifyEmailVerification
}

export default new NotificationService();