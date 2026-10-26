import React from 'react';
import LandingLayout from '../component/LandingLayout';
import Hero from '../component/Hero';
import FeatureCard from '../component/FeatureCard';
import Illustration from '../component/Illustration';
import { features } from '../landing/content';
import styles from '../css/landing.module.css';

export default function Home() {
  return (
    <LandingLayout>
      <Hero />
      <section className={styles.features} aria-label="Features">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </section>
      <figure className={styles.devices}>
        <Illustration
          className={styles.deviceImage}
          file="safe-area-devices.png"
          mobileFile="safe-area-devices-mobile.png"
          alt="iOS and Android phones with blue safe content areas clear of camera cutouts and home indicators."
        />
      </figure>
    </LandingLayout>
  );
}
