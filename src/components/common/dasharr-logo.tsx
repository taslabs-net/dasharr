'use client';

import Image from 'next/image';

interface DasharrLogoProps {
  className?: string;
}

export function DasharrLogo({ className }: DasharrLogoProps) {
  return (
    <>
      <Image
        src="/dasharr-icon-192.png"
        alt="Dasharr Logo"
        width={24}
        height={24}
        className={className || "mr-2"}
      />
      Dasharr
    </>
  );
}