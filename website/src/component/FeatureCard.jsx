import React from 'react';
import styles from '../css/landing.module.css';
import Illustration from './Illustration';

export default function FeatureCard({ feature }) {
  return (
    <div className={styles.feature}>
      <h2 className={styles.featureHeading}>
        <a className={styles.featureLink} href={feature.href}>
          <Illustration file={feature.icon} alt="" width={24} height={24} />
          <span className={styles.linkLabel}>{feature.title}</span>
        </a>
      </h2>
      <p className={styles.featureDescription}>{feature.description}</p>
    </div>
  );
}
