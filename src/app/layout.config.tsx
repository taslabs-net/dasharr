import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { DasharrLogo } from '@/components/common/dasharr-logo';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <DasharrLogo />,
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [
    {
      text: 'Admin',
      url: '/admin',
    },
  ],
};
