import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ServiceConfig } from '@/components/config/service-config';
import { ServiceList } from '@/components/service-list';
import { UnifiConfig } from '@/components/config/unifi-config';
import { DasharrSettings } from '@/components/config/dasharr-settings';
import { MultiServiceConfig } from '@/components/config/multi-service-config';

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ServiceConfig,
    ServiceList,
    UnifiConfig,
    DasharrSettings,
    MultiServiceConfig,
    ...components,
  };
}
