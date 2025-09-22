'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServicePageHeaderProps {
  serviceName: string;
  serviceType: string;
  instanceId?: string;
  icon: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function ServicePageHeader({ 
  serviceName, 
  serviceType, 
  instanceId,
  icon, 
  subtitle,
  children 
}: ServicePageHeaderProps) {
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch service URL
    const fetchServiceUrl = async () => {
      try {
        const response = await fetch('/api/public/instances');
        const data = await response.json();
        // Use provided instanceId or default to serviceType + "1"
        const instance = data.instances?.[instanceId || `${serviceType}1`];
        if (instance?.url) {
          setServiceUrl(instance.url);
        }
      } catch (err) {
        console.error('Failed to fetch service URL:', err);
      }
    };
    
    fetchServiceUrl();
  }, [serviceType, instanceId]);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Image
          src={icon}
          alt={serviceName}
          width={48}
          height={48}
          className="rounded"
        />
        <div>
          <h1 className="mb-2 text-3xl font-bold">{serviceName}</h1>
          {subtitle && (
            <p className="text-fd-muted-foreground">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
      {serviceUrl && (
        <a
          href={serviceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground transition-colors"
        >
          Open {serviceName}
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}