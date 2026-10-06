import React from 'react';
import styles from '../css/landing.module.css';
import { github } from '../landing/content';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>
        Made by{' '}
        <a className={styles.attributionLink} href="https://appandflow.com">
          <span className={styles.linkLabel}>App&Flow</span>
        </a>
      </span>
      <span aria-hidden="true">·</span>
      <a className={styles.link} href={`${github}/blob/main/LICENSE`}>
        <span className={styles.linkLabel}>licensed under the MIT License</span>
      </a>
    </footer>
  );
}
