import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Illustration({ file, mobileFile, ...imageProps }) {
  const assets = useBaseUrl('/img/');
  const image = <img {...imageProps} src={`${assets}${file}`} />;
  return mobileFile ? (
    <picture>
      <source media="(max-width: 760px)" srcSet={`${assets}${mobileFile}`} />
      {image}
    </picture>
  ) : (
    image
  );
}
