import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { AboutLinkOverride } from '@/components/common/about-link-override';
import { LogoutButton } from '@/components/admin/logout-button';
import { AuthGuard } from '@/components/admin/auth-guard';
import './admin.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DocsLayout 
        tree={source.pageTree} 
        {...baseOptions}
        githubUrl="/admin/about"
        sidebar={{
          defaultOpenLevel: 0,
          banner: (
            <div className="mb-4 px-4 space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <p className="text-sm text-fd-muted-foreground">Manage your Dasharr instance</p>
              </div>
              <LogoutButton />
            </div>
          ),
        }}
      >
        <AboutLinkOverride />
        {children}
      </DocsLayout>
    </AuthGuard>
  );
}
