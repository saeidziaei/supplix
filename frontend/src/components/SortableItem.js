import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Grid } from "semantic-ui-react";

export function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Grid>
        <Grid.Column width={1} textAlign="center" verticalAlign="middle">
          <Button
            className="grabbable"
            style={{ boxShadow: "none" }}
            basic
            icon="th"
            size="tiny"
            {...listeners}
            {...attributes}
          />
        </Grid.Column>
        <Grid.Column width={15}>{props.children}</Grid.Column>
      </Grid>
    </div>
  );
}
