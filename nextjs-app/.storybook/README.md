# Storybook for Student Accommodation Management System

Component library and design system documentation built with Storybook.

## 🚀 Getting Started

### Development
```bash
npm run storybook
```

Storybook will start at [http://localhost:6006](http://localhost:6006)

### Build Static Site
```bash
npm run build-storybook
```

Output will be in `storybook-static/` directory.

## 📚 Component Documentation

### UI Components
All components in `src/components/ui/` are documented with:
- Interactive props controls
- Multiple story variants
- Accessibility testing
- Theme support (light/dark)
- Usage examples

### Available Stories

#### Form Components
- **Button** - All variants, sizes, states, icons
- **Input** - Text inputs, validation states
- **Label** - Form labels
- **Textarea** - Multi-line text input
- **Select** - Dropdown selectors

#### Display Components
- **Card** - Container layouts
- **Badge** - Status indicators
- **Alert** - Feedback messages
- **Table** - Data tables
- **Skeleton** - Loading placeholders

#### Overlay Components
- **Dialog** - Modal dialogs

## 🎨 Theme Support

Storybook includes theme switching between light and dark modes:
- Toggle theme in the toolbar
- All components support both themes
- Uses CSS variables from Tailwind config

## ♿ Accessibility Testing

Each component includes accessibility testing with `@storybook/addon-a11y`:
- WCAG 2.1 compliance checks
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility

View accessibility panel in Storybook to see test results.

## 📖 Writing Stories

### Basic Story Structure
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from '@/components/ui/component';

const meta = {
  title: 'UI/Component',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Example',
  },
};
```

### Story Naming Convention
- `Default` - Basic usage
- `[Variant]` - Named variants (e.g., `Destructive`, `Outline`)
- `[Size]` - Size variants (e.g., `Small`, `Large`)
- `[State]` - Different states (e.g., `Disabled`, `Loading`)
- `[UseCase]` - Specific use cases (e.g., `WithIcon`, `InteractiveCard`)

## 🔧 Configuration

### Main Configuration
`.storybook/main.ts` - Storybook configuration
- Next.js framework integration
- Story locations
- Addons configuration
- Webpack customization

### Preview Configuration
`.storybook/preview.ts` - Global settings
- Theme decorator
- Global styles import
- Default parameters
- Control matchers

## 📦 Addons

Installed addons:
- **@storybook/addon-links** - Link stories together
- **@storybook/addon-essentials** - Controls, actions, viewport, etc.
- **@storybook/addon-interactions** - Test interactions
- **@storybook/addon-a11y** - Accessibility testing
- **@storybook/addon-themes** - Theme switching

## 🎯 Best Practices

1. **Document all variants** - Show all possible configurations
2. **Use controls** - Make props interactive
3. **Include examples** - Real-world usage scenarios
4. **Test accessibility** - Verify WCAG compliance
5. **Support both themes** - Test light and dark modes
6. **Add descriptions** - Explain component purpose

## 📱 Mobile Preview

Use the viewport addon to test components in different screen sizes:
- Mobile (375px)
- Tablet (768px)
- Desktop (1024px)
- Custom sizes

## 🔍 Testing in Storybook

### Visual Testing
- Review components in different states
- Test theme variations
- Check responsive behavior

### Interaction Testing
- Test button clicks
- Form submissions
- State changes
- Event handlers

### Accessibility Testing
- Run a11y checks
- Review violation reports
- Fix issues before deployment

## 🌐 Deployment

Storybook can be deployed as a static site:
```bash
npm run build-storybook
```

Deploy `storybook-static/` to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Next.js Integration](https://storybook.js.org/docs/react/get-started/nextjs)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Component Story Format](https://storybook.js.org/docs/react/api/csf)
