/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/first-steps',
      ],
    },
    {
      type: 'category',
      label: 'User Guides',
      items: [
        'guides/student-portal',
        'guides/management-dashboard',
        'guides/property-management',
        'guides/bursary-management',
        'guides/maintenance-requests',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        'api/authentication',
        {
          type: 'category',
          label: 'Management APIs',
          items: [
            'api/management/properties',
            'api/management/students',
            'api/management/rooms',
            'api/management/leases',
            'api/management/bursaries',
            'api/management/maintenance',
            'api/management/dashboard',
          ],
        },
        {
          type: 'category',
          label: 'Student APIs',
          items: [
            'api/student/accommodation',
            'api/student/maintenance',
            'api/student/laundry',
            'api/student/visitors',
            'api/student/complaints',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/database-schema',
        'architecture/authentication',
        'architecture/security',
        'architecture/i18n',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/overview',
        'deployment/environment-variables',
        'deployment/docker',
        'deployment/production-checklist',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/guidelines',
        'contributing/code-standards',
        'contributing/testing',
        'contributing/documentation',
      ],
    },
  ],
};

module.exports = sidebars;
