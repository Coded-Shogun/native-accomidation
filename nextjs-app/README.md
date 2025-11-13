# Student Accommodation Management System - Next.js

A modern, enterprise-grade NSFAS-compliant student accommodation management system built with Next.js 15, TypeScript, and Prisma.

## 🌟 Features

- **NSFAS Compliance** - Full compliance with South African National Student Financial Aid Scheme requirements
- **ISO 27001 & SOC 2** - Enterprise-grade security and compliance
- **WCAG 2.2 Level AA** - Accessibility-first design
- **Multi-language Support** - English, Afrikaans, Zulu, Xhosa
- **Real-time Updates** - Live data synchronization
- **Comprehensive Bursary Management** - Track funding, compliance, and reporting
- **Student Self-Service Portal** - Empower students with self-service capabilities

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- SQLite (development) or PostgreSQL (production)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd nextjs-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (generate with: openssl rand -hex 16)
ENCRYPTION_KEY="your-32-char-hex-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
nextjs-app/
├── prisma/
│   └── schema.prisma          # Database schema (50+ models)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (management)/      # Management portal
│   │   ├── (student)/         # Student portal
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── management/        # Management components
│   │   └── student/           # Student components
│   ├── lib/
│   │   ├── db.ts              # Database utilities
│   │   ├── auth.ts            # Authentication
│   │   ├── logger.ts          # Logging
│   │   ├── security.ts        # Security utilities
│   │   └── utils.ts           # General utilities
│   └── env.ts                 # Environment validation
├── public/                    # Static assets
├── tests/                     # E2E tests (Playwright)
└── docs/                      # Documentation
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # TypeScript type checking
npm run test         # Run E2E tests
npm run test:ui      # Run tests with UI
npm run format       # Format code with Prettier
npm run analyze      # Analyze bundle size
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Code Quality

This project enforces high code quality standards:

- **TypeScript** - Strict mode enabled
- **ESLint** - Next.js recommended config
- **Prettier** - Consistent code formatting
- **Playwright** - E2E testing
- **Husky** - Git hooks for pre-commit checks

## 🔒 Security

### Security Features

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **HTTPS Strict Transport Security (HSTS)** - Forces HTTPS
- **X-Frame-Options** - Prevents clickjacking
- **Input Sanitization** - DOMPurify integration
- **Rate Limiting** - Prevents abuse
- **SQL Injection Prevention** - Prisma parameterized queries
- **Password Hashing** - bcrypt with 12 rounds
- **JWT Authentication** - Secure token-based auth
- **Audit Logging** - ISO 27001 compliance

### OWASP Top 10 Compliance

All OWASP Top 10 vulnerabilities are addressed:

1. ✅ Broken Access Control - RBAC implemented
2. ✅ Cryptographic Failures - AES-256 encryption
3. ✅ Injection - Input sanitization
4. ✅ Insecure Design - Security by design principles
5. ✅ Security Misconfiguration - Secure defaults
6. ✅ Vulnerable Components - Automated dependency scanning
7. ✅ Authentication Failures - NextAuth.js
8. ✅ Software and Data Integrity - SRI enabled
9. ✅ Logging Failures - Winston structured logging
10. ✅ Server-Side Request Forgery - URL validation

## ♿ Accessibility

WCAG 2.2 Level AA compliance:

- **Semantic HTML** - Proper heading hierarchy
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Focus Management** - Visible focus indicators
- **Color Contrast** - 4.5:1 minimum ratio
- **Responsive Design** - Mobile-friendly
- **Skip Links** - Skip to main content
- **Alt Text** - All images have descriptions

## 🌍 Internationalization (i18n)

Supported languages:

- 🇬🇧 English (en) - Default
- 🇿🇦 Afrikaans (af)
- 🇿🇦 Zulu (zu)
- 🇿🇦 Xhosa (xh)

## 🧪 Testing

### E2E Testing with Playwright

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test
npx playwright test tests/auth.spec.ts

# Generate test report
npx playwright show-report
```

### Visual Regression Testing

```bash
npm run test:visual
```

## 📊 Performance

Target Lighthouse scores (≥90 on all metrics):

- ⚡ Performance: ≥90
- ♿ Accessibility: ≥90
- 🎯 Best Practices: ≥90
- 🔍 SEO: ≥90

### Performance Optimizations

- **Code Splitting** - Automatic with Next.js
- **Image Optimization** - next/image
- **Font Optimization** - next/font
- **Tree Shaking** - Unused code elimination
- **Lazy Loading** - On-demand component loading
- **Caching** - Aggressive caching strategy

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t accommodation-system .

# Run container
docker run -p 3000:3000 accommodation-system
```

### Environment Variables

Ensure all required environment variables are set in production:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ENCRYPTION_KEY`
- `SMTP_*` (for email)
- `NEXT_PUBLIC_APP_URL`

## 📖 Documentation

- [Migration Status](./MIGRATION_STATUS.md) - Track migration progress
- [API Documentation](./docs/API.md) - API reference
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Security](./docs/SECURITY.md) - Security documentation
- [Compliance](./docs/COMPLIANCE.md) - NSFAS, ISO 27001, SOC 2

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

For support, contact: support@accommodation.example.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- shadcn for the beautiful UI components
- Vercel for hosting solutions

---

**Built with ❤️ for NSFAS Compliance**

**Version:** 1.0.0
**Last Updated:** 2025-01-13
