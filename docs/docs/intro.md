---
sidebar_position: 1
---

# Introduction

Welcome to the **Student Accommodation Management System** documentation - a comprehensive, enterprise-grade platform designed specifically for South African higher education institutions.

## 🎯 What is it?

The Student Accommodation Management System is a modern, full-stack web application built with Next.js 15 that provides:

- **Property Management**: Complete oversight of student accommodation properties
- **Student Portal**: Self-service portal for students to manage their accommodation
- **Bursary Management**: NSFAS-compliant funding tracking and reporting
- **Maintenance Management**: Request and track property maintenance issues
- **Compliance Tracking**: ISO 27001 and SOC 2 compliant audit logging
- **Multi-language Support**: English, Afrikaans, isiZulu, and isiXhosa

## ✨ Key Features

### For Property Managers
- Dashboard with real-time statistics and KPIs
- Property, room, and lease management
- Student account management
- Bursary assignment and tracking
- Maintenance request oversight
- Comprehensive reporting

### For Students
- Personal dashboard with accommodation details
- Submit and track maintenance requests
- Book laundry facilities
- Register visitors
- Submit complaints anonymously
- View property notices and announcements
- Order from property kiosk
- Track package deliveries

### Enterprise Features
- **Security**: OWASP Top 10 compliance, CSP, HSTS
- **Authentication**: NextAuth.js v5 with role-based access control
- **Accessibility**: WCAG 2.2 Level AA compliant
- **Performance**: Optimized with Next.js App Router
- **Testing**: E2E tests with Playwright and accessibility checks
- **Observability**: Structured logging with Winston
- **Compliance**: ISO 27001 and SOC 2 Type II ready

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/student-accommodation.git

# Install dependencies
cd student-accommodation/nextjs-app
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation Structure

This documentation is organized into several sections:

- **Getting Started**: Installation, configuration, and first steps
- **User Guides**: How to use different features of the system
- **API Reference**: Complete API documentation for developers
- **Architecture**: System design and technical details
- **Deployment**: Production deployment guides
- **Contributing**: Guidelines for contributors

## 🌍 NSFAS Compliance

The system is specifically designed for South African institutions and includes:

- R45,000 annual NSFAS cap enforcement
- 20km distance eligibility checking
- SA ID number validation with Luhn checksum
- Multi-language support for South African languages
- Local currency (ZAR) formatting

## 🔒 Security & Compliance

Built with security and compliance as core principles:

- ✅ OWASP Top 10 security standards
- ✅ ISO 27001 information security management
- ✅ SOC 2 Type II controls
- ✅ GDPR/POPIA data protection
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive audit logging
- ✅ Encrypted sensitive data

## ♿ Accessibility

Fully accessible to all users:

- ✅ WCAG 2.2 Level AA compliant
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Proper ARIA labels and roles
- ✅ Color contrast compliance
- ✅ Focus management

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (PostgreSQL/MySQL compatible)
- **Authentication**: NextAuth.js v5
- **Testing**: Playwright, Jest, @axe-core/playwright
- **i18n**: next-intl
- **UI Components**: Radix UI, shadcn/ui pattern

## 📞 Support

Need help? Here are your options:

- 📖 **Documentation**: You're reading it!
- 💬 **GitHub Discussions**: Ask questions and share ideas
- 🐛 **GitHub Issues**: Report bugs and request features
- 📧 **Email Support**: support@example.com

## 📝 License

Copyright © 2025 Student Accommodation Management System. All rights reserved.

---

**Ready to get started?** Head over to the [Installation Guide](getting-started/installation.md) to set up your development environment.
