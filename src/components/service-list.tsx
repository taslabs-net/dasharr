'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ServiceInfo {
  name: string;
  icon: string;
  href: string;
  description: string;
}

const services: ServiceInfo[] = [
  {
    name: 'Plex',
    icon: '/icons/plex.svg',
    href: '/admin/plex',
    description: 'Media server configuration',
  },
  {
    name: 'Jellyfin',
    icon: '/icons/jellyfin.svg',
    href: '/admin/jellyfin',
    description: 'Media server configuration',
  },
  {
    name: 'Tautulli',
    icon: '/icons/tautulli.svg',
    href: '/admin/tautulli',
    description: 'Plex statistics configuration',
  },
  {
    name: 'Overseerr',
    icon: '/icons/overseerr.svg',
    href: '/admin/overseerr',
    description: 'Media request management',
  },
  {
    name: 'Jellyseerr',
    icon: '/icons/jellyseerr.svg',
    href: '/admin/jellyseerr',
    description: 'Jellyfin media request management',
  },
  {
    name: 'Radarr',
    icon: '/icons/radarr.svg',
    href: '/admin/radarr',
    description: 'Movie management configuration',
  },
  {
    name: 'Sonarr',
    icon: '/icons/sonarr.svg',
    href: '/admin/sonarr',
    description: 'TV show management configuration',
  },
  {
    name: 'Prowlarr',
    icon: '/icons/prowlarr.svg',
    href: '/admin/prowlarr',
    description: 'Indexer management configuration',
  },
  {
    name: 'SABnzbd',
    icon: '/icons/sabnzbd.svg',
    href: '/admin/sabnzbd',
    description: 'Usenet downloader configuration',
  },
  {
    name: 'qBittorrent',
    icon: '/icons/qbittorrent.svg',
    href: '/admin/qbittorrent',
    description: 'BitTorrent client configuration',
  },
  {
    name: 'UniFi',
    icon: '/icons/unifi.svg',
    href: '/admin/unifi',
    description: 'Network monitoring configuration',
  },
];

export function ServiceList() {
  return (
    <div className="space-y-3 my-6">
      {services.map((service) => (
        <Link
          key={service.name}
          href={service.href}
          className="flex items-center gap-3 p-3 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-muted/50 transition-colors group"
        >
          <Image
            src={service.icon}
            alt={`${service.name} icon`}
            width={32}
            height={32}
            className="rounded"
          />
          <div className="flex-1">
            <div className="font-semibold group-hover:text-fd-primary transition-colors">
              {service.name}
            </div>
            <div className="text-sm text-fd-muted-foreground">
              {service.description}
            </div>
          </div>
          <svg
            className="w-4 h-4 text-fd-muted-foreground group-hover:text-fd-foreground transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}