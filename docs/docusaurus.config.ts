import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'React Native Safe Area Context',
  tagline: 'A flexible way to handle safe area insets',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://rnsac.appandflow.com',
  // The docs are served under /docs/ next to the landing page in `website/`.
  // See vercel.json at the repository root.
  baseUrl: '/docs/',

  organizationName: 'AppAndFlow', // Usually your GitHub org/user name.
  projectName: 'react-native-safe-area-context', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/AppAndFlow/react-native-safe-area-context/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/opengraph-image.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Safe Area Context',
      hideOnScroll: true,
      logo: {
        alt: 'App & Flow Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/AppAndFlow/react-native-safe-area-context',
          className: 'header-github',
          'aria-label': 'GitHub repository',
          position: 'right',
        },
      ],
    },
    footer: {
      logo: {
        alt: 'App & Flow Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      style: 'light',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} App & Flow. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
