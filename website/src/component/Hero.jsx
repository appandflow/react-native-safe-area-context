import React from 'react';
import styles from '../css/landing.module.css';
import InstallCommand from './InstallCommand';

export default function Hero() {
  return (
    <header className={styles.hero}>
      <h1 className={styles.title}>
        Simplifying Layout Management with React Native Safe Area Context
      </h1>
      <InstallCommand />
    </header>
  );
}
