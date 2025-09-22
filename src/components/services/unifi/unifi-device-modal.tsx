'use client';

import { useState, useEffect } from 'react';
import { X, Router } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  model: string;
  type?: string;
  state: string;
  status?: string;
  ipAddress: string;
  macAddress: string;
  uptime?: number;
  cpu?: number;
  memory?: number;
  features: string[];
}

interface UnifiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'online' | 'offline';
  siteIndex: number;
}

export function UnifiDeviceModal({ isOpen, onClose, status, siteIndex }: UnifiDeviceModalProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen, status, siteIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/services/unifi/devices?site=${siteIndex}&status=${status}`);
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-fd-card border border-fd-border rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-fd-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Router className="w-5 h-5" />
            {status === 'online' ? 'Online' : 'Offline'} UniFi Devices
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-fd-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fd-primary"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && devices.length === 0 && (
            <div className="text-center py-8 text-fd-muted-foreground">
              No {status} devices found
            </div>
          )}

          {!loading && !error && devices.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-fd-muted-foreground mb-4">
                Found {devices.length} {status} device{devices.length !== 1 ? 's' : ''}
              </p>
              
              <div className="grid gap-4">
                {devices.map((device) => (
                  <div key={device.id} className="border border-fd-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{device.name}</h3>
                        <p className="text-sm text-fd-muted-foreground">{device.model}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          device.state === 'ONLINE'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {device.state}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-fd-muted-foreground">IP Address:</span>
                        <br />
                        <span className="font-mono">{device.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-fd-muted-foreground">MAC Address:</span>
                        <br />
                        <span className="font-mono text-xs">{device.macAddress}</span>
                      </div>
                      {device.cpu !== undefined && (
                        <div>
                          <span className="text-fd-muted-foreground">CPU Usage:</span>
                          <br />
                          <span>{device.cpu}%</span>
                        </div>
                      )}
                      {device.memory !== undefined && (
                        <div>
                          <span className="text-fd-muted-foreground">Memory Usage:</span>
                          <br />
                          <span>{device.memory}%</span>
                        </div>
                      )}
                      {device.type && (
                        <div>
                          <span className="text-fd-muted-foreground">Type:</span>
                          <br />
                          <span>{device.type}</span>
                        </div>
                      )}
                    </div>
                    
                    {device.features.length > 0 && (
                      <div className="mt-3">
                        <span className="text-fd-muted-foreground text-sm">Features:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {device.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-fd-muted/20 rounded text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}