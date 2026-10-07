import React, { useEffect, useRef, useState } from 'react';
import styles from '../css/landing.module.css';
import Illustration from './Illustration';
import { command, docs } from '../landing/content';

export default function InstallCommand() {
  const [copyStatus, setCopyStatus] = useState('');
  const copied = copyStatus === 'Copied!';
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  async function copyCommand() {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus('Copied!');
      resetTimer.current = setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Select the command to copy it manually.');
    }
  }
  return (
    <>
      <div className={styles.actions}>
        <a className={styles.getStarted} href={docs}>
          <span>Get started</span>
        </a>
        <div className={styles.install}>
          <code className={styles.command}>{command}</code>
          <button
            className={styles.copyButton}
            type="button"
            onClick={copyCommand}
            aria-label={copied ? 'Copied' : 'Copy install command'}
            title={copied ? 'Copied' : 'Copy'}
          >
            <span className={styles.copyIcons} aria-hidden="true">
              <Illustration
                className={styles.copyIcon}
                file="copy.svg"
                alt=""
                width={12}
                height={12}
                style={{
                  opacity: copied ? 0 : 1,
                  transform: copied ? 'scale(0.33)' : 'scale(1)',
                }}
              />
              <svg
                className={styles.copySuccess}
                viewBox="0 0 24 24"
                width={12}
                height={12}
                style={{
                  opacity: copied ? 1 : 0,
                  transform: copied ? 'scale(1)' : 'scale(0.33)',
                  transitionDelay: copied ? '75ms' : '0ms',
                }}
              >
                <path
                  fill="currentColor"
                  d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
      <output className={styles.copyStatus} aria-live="polite">
        {copied ? '' : copyStatus}
      </output>
      <output className={styles.screenReaderOnly} aria-live="polite">
        {copied ? copyStatus : ''}
      </output>
    </>
  );
}
