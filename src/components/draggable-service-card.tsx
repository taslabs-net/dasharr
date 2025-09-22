'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ServiceCard } from './service-card';
import type { ServiceInstanceInfo } from '@/hooks/useMultiServiceOrder';

export function DraggableServiceCard({ 
  id, 
  type,
  displayName, 
  icon, 
  href, 
  configured, 
  apiEndpoint 
}: ServiceInstanceInfo) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSortableDragging ? undefined : transition,
    opacity: isSortableDragging ? 0.7 : 1,
    zIndex: isSortableDragging ? 1000 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`
        draggable-card 
        touch-none 
        cursor-grab 
        active:cursor-grabbing
        ${isSortableDragging ? 'scale-105 rotate-2 shadow-xl' : ''}
      `}
      data-dragging={isSortableDragging}
    >
      <ServiceCard
        name={displayName}
        type={type}
        icon={icon}
        href={href}
        configured={configured}
        apiEndpoint={apiEndpoint}
        isDragging={isSortableDragging}
      />
    </div>
  );
}