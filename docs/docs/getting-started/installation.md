---
sidebar_position: 1
---

# Installation

This guide will help you set up the Student Accommodation Management System on your local development machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **SQLite**: Version 3.x (included with most systems)

### Verify Prerequisites

```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 9.x or higher
git --version   # Any recent version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/student-accommodation.git
cd student-accommodation
```

### 2. Navigate to Next.js Application

```bash
cd nextjs-app
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Next.js 15
- React 19
- Prisma 6
- NextAuth.js v5
- Tailwind CSS
- And many more...

### 4. Set Up Environment Variables

Create a `.env` file in the `nextjs-app` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters-long"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Node Environment
NODE_ENV="development"
```

:::tip Generating Secrets
Generate a secure secret for `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Generate a 32-character encryption key:
```bash
openssl rand -hex 16
```
:::

### 5. Initialize the Database

Generate Prisma client:
```bash
npx prisma generate
```

Push the schema to the database:
```bash
npx prisma db push
```

### 6. Seed the Database (Optional)

If you want to populate the database with sample data:

```bash
npm run db:seed
```

This will create:
- Demo admin, manager, and student accounts
- Sample properties
- Sample rooms and leases
- Test bursary data

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Verification

### Access the Application

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

You should see the landing page.

### Demo Credentials

Use these credentials to log in:

**Admin Account:**
- Email: `admin@example.com`
- Password: `Admin123!`

**Manager Account:**
- Email: `manager@example.com`
- Password: `Manager123!`

**Student Account:**
- Email: `student@example.com`
- Password: `Student123!`

### Verify Database

Check the database with Prisma Studio:

```bash
npx prisma studio
```

This opens a web interface at [http://localhost:5555](http://localhost:5555) where you can browse your database.

## Development Tools

### Storybook (Component Library)

Start Storybook to view and develop UI components:

```bash
npm run storybook
```

Available at [http://localhost:6006](http://localhost:6006)

### Testing

Run E2E tests with Playwright:

```bash
npm test
```

Run tests in debug mode:

```bash
npx playwright test --debug
```

### Linting

Check code quality:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it:

```bash
PORT=3001 npm run dev
```

### Database Connection Issues

If you encounter database errors:

1. Delete the database file:
```bash
rm prisma/dev.db
```

2. Regenerate:
```bash
npx prisma db push
```

### Node Version Issues

If you're using an older Node.js version:

1. Install [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
2. Install the correct version:
```bash
nvm install 18
nvm use 18
```

### Module Not Found Errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

Now that you have the system installed and running:

1. 📖 Read the [Configuration Guide](configuration.md) to customize your setup
2. 🎯 Follow the [First Steps Tutorial](first-steps.md) to learn the basics
3. 👤 Check out the [Student Portal Guide](../guides/student-portal.md)
4. 🏢 Explore the [Management Dashboard](../guides/management-dashboard.md)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Need Help?** If you encounter any issues during installation, please:
- Check the [GitHub Issues](https://github.com/your-org/student-accommodation/issues)
- Ask in [GitHub Discussions](https://github.com/your-org/student-accommodation/discussions)
- Contact support at support@example.com
