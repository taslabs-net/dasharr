'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import Link from 'next/link';
import { DraggableServiceCard } from '@/components/draggable-service-card';
import { useMultiServiceOrder } from '@/hooks/useMultiServiceOrder';
import { ServiceCard } from '@/components/service-card';

export default function HomePage() {
  const { services, saveOrder, isClient, isLoading } = useMultiServiceOrder();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((item) => item.id === active.id);
      const newIndex = services.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(services, oldIndex, newIndex);
      saveOrder(newOrder);
    }
    
    setActiveId(null);
  };

  // Show loading state while hydrating or checking configurations
  if (!isClient || isLoading) {
    return (
      <main className="flex flex-1 flex-col p-8 min-h-screen">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-fd-border bg-fd-card p-6 h-40 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }
  
  // Show message if no services are configured
  if (services.length === 0) {
    return (
      <main className="flex flex-1 flex-col p-8 min-h-screen">
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Dasharr!</h2>
          <p className="text-fd-muted-foreground mb-8">
            No services are configured yet. Get started by setting up your media services.
          </p>
          <Link 
            href="/admin" 
            className="inline-flex items-center px-6 py-3 bg-fd-foreground text-fd-background rounded-md hover:bg-fd-foreground/90 transition-colors"
          >
            Go to Configuration →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-8 min-h-screen">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={services.map(s => s.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <DraggableServiceCard
                key={service.id}
                {...service}
              />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              <ServiceCard
                name={services.find(s => s.id === activeId)?.displayName || ''}
                type={services.find(s => s.id === activeId)?.type}
                icon={services.find(s => s.id === activeId)?.icon || ''}
                configured={services.find(s => s.id === activeId)?.configured || false}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}