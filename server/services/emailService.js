const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { logger, logAudit } = require('../utils/logger');

class EmailService {
  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email service initialization failed:', error);
        } else {
          logger.info('Email service ready to send messages');
        }
      });
    } else {
      logger.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    }
  }

  /**
   * Load and compile email template
   */
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templateName}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      logger.error('Template loading failed:', { templateName, error: error.message });
      throw error;
    }
  }

  /**
   * Send email with template
   */
  async sendEmail({ to, subject, templateName, data }) {
    try {
      const html = await this.loadTemplate(templateName, data);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Student Accommodation <noreply@accommodation.com>',
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Audit log
      logAudit({
        eventType: 'EMAIL_SENT',
        metadata: {
          to,
          subject,
          templateName,
          messageId: info.messageId,
        },
      });

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to,
        subject,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        to,
        subject,
      });
      throw error;
    }
  }

  // ===== Student-specific emails =====

  /**
   * Welcome email for new students
   */
  async sendWelcomeEmail(student) {
    return this.sendEmail({
      to: student.email,
      subject: 'Welcome to Student Accommodation',
      templateName: 'welcome',
      data: {
        firstName: student.first_name,
        lastName: student.last_name,
        studentNumber: student.student_number,
        email: student.email,
        institution: student.institution,
      },
    });
  }

  /**
   * Lease expiration reminder
   */
  async sendLeaseExpirationReminder(student, lease, daysRemaining) {
    return this.sendEmail({
      to: student.email,
      subject: `Lease Expiring in ${daysRemaining} Days`,
      templateName: 'lease-expiration',
      data: {
        firstName: student.first_name,
        daysRemaining,
        leaseEndDate: new Date(lease.end_date).toLocaleDateString(),
        propertyName: lease.property_name,
        roomNumber: lease.room_number,
        monthlyAmount: lease.monthly_amount,
      },
    });
  }

  /**
   * Maintenance request update
   */
  async sendMaintenanceUpdate(student, maintenance, status) {
    return this.sendEmail({
      to: student.email,
      subject: `Maintenance Request #${maintenance.id} - ${status}`,
      templateName: 'maintenance-update',
      data: {
        firstName: student.first_name,
        requestId: maintenance.id,
        title: maintenance.title,
        status,
        category: maintenance.category,
        priority: maintenance.priority,
        reportedDate: new Date(maintenance.reported_date).toLocaleDateString(),
        description: maintenance.description,
      },
    });
  }

  /**
   * Payment reminder
   */
  async sendPaymentReminder(student, lease, amountDue) {
    return this.sendEmail({
      to: student.email,
      subject: 'Monthly Payment Reminder',
      templateName: 'payment-reminder',
      data: {
        firstName: student.first_name,
        amountDue,
        dueDate: new Date().toLocaleDateString(),
        propertyName: lease.property_name,
        roomNumber: lease.room_number,
        studentNumber: student.student_number,
      },
    });
  }

  /**
   * Security/Access alert
   */
  async sendAccessAlert(student, property, alertType, details) {
    return this.sendEmail({
      to: student.email,
      subject: 'Security Alert - Unusual Access Detected',
      templateName: 'access-alert',
      data: {
        firstName: student.first_name,
        alertType,
        propertyName: property.name,
        timestamp: new Date().toLocaleString(),
        details: details || 'Please contact security if this was not you.',
      },
    });
  }

  /**
   * Visitor approved notification
   */
  async sendVisitorApproval(student, visitor) {
    return this.sendEmail({
      to: student.email,
      subject: 'Visitor Approved',
      templateName: 'visitor-approved',
      data: {
        firstName: student.first_name,
        visitorName: visitor.name,
        visitDate: new Date(visitor.visit_date).toLocaleDateString(),
        visitTime: visitor.visit_time,
        accessCode: visitor.access_code,
      },
    });
  }

  /**
   * Notice board update
   */
  async sendNoticeNotification(students, notice) {
    const promises = students.map((student) =>
      this.sendEmail({
        to: student.email,
        subject: `New Notice: ${notice.title}`,
        templateName: 'notice-notification',
        data: {
          firstName: student.first_name,
          noticeTitle: notice.title,
          noticeContent: notice.content,
          noticeCategory: notice.category,
          postedDate: new Date(notice.created_at).toLocaleDateString(),
        },
      })
    );

    return Promise.allSettled(promises);
  }

  /**
   * Laundry machine available
   */
  async sendLaundryAvailableNotification(student, machine) {
    return this.sendEmail({
      to: student.email,
      subject: 'Washing Machine Now Available',
      templateName: 'laundry-available',
      data: {
        firstName: student.first_name,
        machineNumber: machine.machine_number,
        location: machine.location,
      },
    });
  }

  /**
   * WiFi password update
   */
  async sendWiFiPasswordUpdate(students, newPassword, validUntil) {
    const promises = students.map((student) =>
      this.sendEmail({
        to: student.email,
        subject: 'WiFi Password Updated',
        templateName: 'wifi-password',
        data: {
          firstName: student.first_name,
          password: newPassword,
          validUntil: new Date(validUntil).toLocaleDateString(),
        },
      })
    );

    return Promise.allSettled(promises);
  }

  /**
   * Delivery notification
   */
  async sendDeliveryNotification(student, delivery) {
    return this.sendEmail({
      to: student.email,
      subject: 'Package Delivered',
      templateName: 'delivery-notification',
      data: {
        firstName: student.first_name,
        trackingNumber: delivery.tracking_number,
        deliveredDate: new Date(delivery.delivered_at).toLocaleDateString(),
        pickupLocation: delivery.pickup_location,
        courier: delivery.courier,
      },
    });
  }
}

module.exports = new EmailService();
