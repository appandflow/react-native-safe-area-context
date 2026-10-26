import React from 'react';
import LayoutProvider from '@theme/Layout/Provider';
import SkipToContent from '@theme/SkipToContent';
import {
  PageMetadata,
  SkipToContentFallbackId,
} from '@docusaurus/theme-common';
import styles from '../css/landing.module.css';
import Navigation from './Navigation';
import Footer from './Footer';
import Illustration from './Illustration';

export default function LandingLayout({ children }) {
  return (
    <LayoutProvider>
      <PageMetadata
        title="React Native Safe Area Context"
        description="Simplify safe area layouts on iOS, Android, and web."
      />
      <SkipToContent />
      <div className={styles.page}>
        <a
          className={styles.brandLink}
          href="https://appandflow.com"
          aria-label="App&Flow"
        >
          <Illustration
            className={styles.brandImage}
            file="brand.svg"
            mobileFile="brand-mobile.svg"
            alt=""
            width={24}
            height={24}
          />
        </a>
        <div className={styles.rail}>
          <Navigation />
          <main className={styles.main} id={SkipToContentFallbackId}>
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </LayoutProvider>
  );
}
