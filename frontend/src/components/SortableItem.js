import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "semantic-ui-react";

export function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4">
      <div 
        className="cursor-move text-gray-300 hover:text-gray-600 flex items-center -mt-14" 
        {...attributes} 
        {...listeners}
      >
        <Icon name="bars" />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
