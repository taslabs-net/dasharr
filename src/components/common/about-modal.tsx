'use client';

import { useState } from 'react';
import { DasharrLogo } from '@/components/common/dasharr-logo';
import { GithubInfo } from 'fumadocs-ui/components/github-info';

const VERSION = '0.6.0-dev';

export function AboutModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
      >
        v{VERSION}
      </button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DasharrLogo />
              <h2 className="text-lg font-semibold">About Dasharr</h2>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold">Dasharr</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Version {VERSION}
                </p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>
                  Dasharr is a unified dashboard for managing your media server infrastructure.
                </p>
                <p>
                  Monitor and control your Plex, Jellyfin, Radarr, Sonarr, and other services
                  from a single, beautiful interface.
                </p>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                <p>
                  Built with Next.js and TypeScript
                </p>
              </div>
              
              {/* GitHub Info */}
              <div className="flex justify-center pt-2">
                <GithubInfo 
                  owner="taslabs-net" 
                  repo="dasharr" 
                  className="text-sm"
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}