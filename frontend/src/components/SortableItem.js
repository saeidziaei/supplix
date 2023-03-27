import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { Button } from "semantic-ui-react";

export function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style}>
      
        <Button
          className="grabbable"
          style={{ boxShadow: "none", opacity: "50%" }}
          basic
          icon="th"
          size="tiny"
          {...listeners}
          {...attributes}
        />
        <div>{props.children}</div>
      
    </div>
  );
}
