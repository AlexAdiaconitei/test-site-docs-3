import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { portalName, portalUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: portalName,
      url: portalUrl,
    },
  };
}
