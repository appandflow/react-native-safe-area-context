import React from 'react';
import styles from '../css/landing.module.css';
import Illustration from './Illustration';
import { docs, github } from '../landing/content';
import packageJson from '../../../package.json';

export default function Navigation() {
  return (
    <nav className={styles.navigation} aria-label="Main navigation">
      <a className={[styles.packageName, styles.link].join(' ')} href={github}>
        <span className={styles.linkLabel}>react-native-safe-area-context</span>
      </a>
      <a
        className={styles.githubLink}
        href={github}
        aria-label={`GitHub repository, version ${packageJson.version}`}
      >
        <Illustration file="github.svg" alt="" width={16} height={16} />
        <span>·</span>
        <span className={styles.linkLabel}>v{packageJson.version}</span>
      </a>
      <a className={styles.link} href={docs}>
        <span className={styles.linkLabel}>Documentation</span>
      </a>
      <a className={styles.link} href={`${docs}api/safe-area-provider`}>
        <span className={styles.linkLabel}>API</span>
      </a>
    </nav>
  );
}
