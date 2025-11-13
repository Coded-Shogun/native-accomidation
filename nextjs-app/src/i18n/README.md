# Internationalization (i18n) Setup

This application supports multi-language functionality using next-intl.

## Supported Languages

- **English (en)** - Default language
- **Afrikaans (af)** - South African language
- **isiZulu (zu)** - South African language
- **isiXhosa (xh)** - South African language

## Configuration Files

### `config.ts`
Defines available locales, default locale, and display names with flags.

### `request.ts`
Server-side configuration for loading translation messages based on the current locale.

## Translation Files

Translation files are located in `/messages/` directory:
- `en.json` - English translations
- `af.json` - Afrikaans translations
- `zu.json` - isiZulu translations
- `xh.json` - isiXhosa translations

## Usage in Components

### Server Components
```typescript
import { useTranslations } from 'next-intl';

export default function ServerComponent() {
  const t = useTranslations('common');

  return <h1>{t('welcome')}</h1>;
}
```

### Client Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('dashboard');

  return <p>{t('totalStudents')}</p>;
}
```

## Language Switcher

A language switcher component is available at `/components/language-switcher.tsx`.

Usage:
```typescript
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## Adding New Translations

1. Add the translation key and value to all language files in `/messages/`
2. Use the translation in your component with `useTranslations()`

Example:
```json
// messages/en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

```typescript
const t = useTranslations('newFeature');
<h2>{t('title')}</h2>
<p>{t('description')}</p>
```

## Translation Namespaces

Translations are organized into namespaces:
- `common` - Common UI elements (buttons, labels, etc.)
- `nav` - Navigation menu items
- `dashboard` - Dashboard-specific translations
- `properties` - Properties management
- `students` - Student management
- `maintenance` - Maintenance requests
- `bursaries` - Bursary management
- `accommodation` - Accommodation details
- `auth` - Authentication pages
- `errors` - Error messages
- `status` - Status labels

## ICU Message Format

next-intl supports ICU message format for pluralization and variables:

```json
{
  "itemsCount": "{count, plural, =0 {No items} one {# item} other {# items}}"
}
```

```typescript
t('itemsCount', { count: 5 }); // "5 items"
```

## Best Practices

1. Always use translation keys instead of hardcoded text
2. Keep translation files in sync across all languages
3. Use meaningful namespace names
4. Group related translations together
5. Test the application in all supported languages
6. Consider RTL (Right-to-Left) support if needed in the future

## Accessibility

All translations maintain WCAG 2.2 Level AA compliance:
- Clear and concise text
- Proper semantic structure
- Consistent terminology across languages
- Culturally appropriate content
