'use client';

import { useState, useEffect } from 'react';
import { X, Users, Wifi, Network } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  hostname?: string;
  ip: string;
  mac: string;
  network: string;
  type: 'WIRED' | 'WIRELESS';
  signal?: number;
  rxBytes: number;
  txBytes: number;
}

interface UnifiClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'wired' | 'wireless' | 'all';
  siteIndex: number;
}

export function UnifiClientModal({ isOpen, onClose, type, siteIndex }: UnifiClientModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen, type, siteIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const typeParam = type === 'all' ? '' : `&type=${type}`;
      const response = await fetch(`/api/services/unifi/clients?site=${siteIndex}${typeParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.clients || []);
      setNote(data.note || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTitle = () => {
    switch (type) {
      case 'wired': return 'Wired Clients';
      case 'wireless': return 'Wireless Clients';
      default: return 'All Clients';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'wired': return <Network className="w-5 h-5" />;
      case 'wireless': return <Wifi className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
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
            {getIcon()}
            {getTitle()}
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

          {!loading && !error && clients.length === 0 && (
            <div className="text-center py-8 text-fd-muted-foreground">
              No {type === 'all' ? '' : type} clients found
            </div>
          )}

          {!loading && !error && clients.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-fd-muted-foreground">
                  Found {clients.length} active {type === 'all' ? '' : type} client{clients.length !== 1 ? 's' : ''}
                </p>
                {note && (
                  <p className="text-xs text-fd-muted-foreground italic">{note}</p>
                )}
              </div>
              
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div key={client.id} className="border border-fd-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        {client.hostname && client.hostname !== client.name && (
                          <p className="text-sm text-fd-muted-foreground">{client.hostname}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {client.type === 'WIRELESS' ? (
                          <Wifi className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Network className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-fd-muted-foreground">
                          {client.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-fd-muted-foreground">IP Address:</span>
                        <br />
                        <span className="font-mono">{client.ip}</span>
                      </div>
                      <div>
                        <span className="text-fd-muted-foreground">MAC Address:</span>
                        <br />
                        <span className="font-mono text-xs">{client.mac}</span>
                      </div>
                      <div>
                        <span className="text-fd-muted-foreground">Network:</span>
                        <br />
                        <span>{client.network}</span>
                      </div>
                      {client.signal !== undefined && (
                        <div>
                          <span className="text-fd-muted-foreground">Signal:</span>
                          <br />
                          <span>{client.signal} dBm</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-fd-muted-foreground">Downloaded:</span>
                        <br />
                        <span className="text-green-600">{formatBytes(client.rxBytes)}</span>
                      </div>
                      <div>
                        <span className="text-fd-muted-foreground">Uploaded:</span>
                        <br />
                        <span className="text-blue-600">{formatBytes(client.txBytes)}</span>
                      </div>
                    </div>
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