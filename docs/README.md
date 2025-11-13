# Documentation Site

This directory contains the Docusaurus-powered documentation site for the Student Accommodation Management System.

## 🚀 Quick Start

### Installation

```bash
cd docs
npm install
```

### Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window at [http://localhost:3000](http://localhost:3000). Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## 📚 Documentation Structure

```
docs/
├── docs/                    # Documentation content
│   ├── intro.md            # Introduction page
│   ├── getting-started/    # Installation and setup
│   ├── guides/             # User guides
│   ├── api/                # API reference
│   ├── architecture/       # System architecture
│   ├── deployment/         # Deployment guides
│   └── contributing/       # Contributing guidelines
├── blog/                   # Blog posts
├── src/                    # React components
│   ├── components/         # Custom components
│   ├── css/               # Custom CSS
│   └── pages/             # Custom pages
├── static/                 # Static files
│   ├── img/               # Images
│   └── files/             # Downloadable files
├── docusaurus.config.js   # Site configuration
├── sidebars.js            # Sidebar structure
└── package.json           # Dependencies
```

## 🌍 Internationalization

The documentation supports multiple languages:
- English (en) - Default
- Afrikaans (af)
- isiZulu (zu)
- isiXhosa (xh)

### Adding Translations

1. Extract translatable strings:
```bash
npm run write-translations -- --locale af
```

2. Translate the JSON files in `i18n/af/`

3. Build with all locales:
```bash
npm run build
```

## 📝 Writing Documentation

### Creating a New Page

1. Create a new Markdown file in `docs/`:
```bash
touch docs/my-new-page.md
```

2. Add frontmatter:
```markdown
---
sidebar_position: 3
---

# My New Page

Content goes here...
```

3. The page will automatically appear in the sidebar.

### Adding to Sidebar

Edit `sidebars.js` to customize sidebar structure:

```javascript
{
  type: 'category',
  label: 'My Category',
  items: [
    'my-new-page',
    'another-page',
  ],
}
```

### Markdown Features

Docusaurus supports enhanced Markdown:

```markdown
:::tip
Helpful tip for users
:::

:::warning
Warning message
:::

:::danger
Danger zone!
:::

```javascript
// Code block with syntax highlighting
const example = 'Hello World';
```

[Link to another page](./intro.md)

![Image](../static/img/screenshot.png)
```

## 🎨 Customization

### Theme Colors

Edit `src/css/custom.css` to customize colors:

```css
:root {
  --ifm-color-primary: #00a651;
  --ifm-color-primary-dark: #009549;
  /* ... */
}
```

### Logo and Favicon

Replace files in `static/img/`:
- `logo.svg` - Site logo
- `favicon.ico` - Browser favicon

### Custom Components

Create React components in `src/components/` and use them in MDX files.

## 🔍 Search

Docusaurus supports Algolia DocSearch for documentation search:

1. Apply for DocSearch: https://docsearch.algolia.com/apply/
2. Update `docusaurus.config.js` with your credentials
3. Search will be enabled automatically

## 📦 Deployment

### Deploy to GitHub Pages

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`

### Deploy to Vercel

1. Import your repository
2. Framework preset: Docusaurus
3. Deploy!

## 🧪 Testing

### Check for broken links

```bash
npm run build
npm run serve
# Visit http://localhost:3000 and check for broken links
```

### Validate MDX

Docusaurus will show errors during build if MDX is invalid.

## 📖 Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [MDX Documentation](https://mdxjs.com/)

## 🤝 Contributing

Contributions to documentation are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- 📖 Documentation: https://your-docs-site.com
- 💬 GitHub Discussions: https://github.com/your-org/student-accommodation/discussions
- 🐛 Report Issues: https://github.com/your-org/student-accommodation/issues
