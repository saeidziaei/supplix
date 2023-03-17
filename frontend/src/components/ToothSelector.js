import React, { useState } from "react";
import { useField } from "formik";
import { Button, Grid, GridColumn, Header, Icon, Label, List, Modal } from "semantic-ui-react";

export default function ToothSelector({value, onChange}) {
  // const name = props.name;
  // const [field] = useField(values);
  const [open, setOpen] = React.useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState(value || []);
  const [previousSelectedTeeth, setPreviousSelectedTeeth] = useState(null);

  const renderTeethRow = (reverse, idPrefix) => {
    // idPrefix: upper-left, upper-right, lower-left, lower-right
    //            ul, ur, ll, lr

    return [...Array(8).keys()].map((i) => {
      const index = reverse ? 8 - i : i + 1;
      const name = `${idPrefix}-${index}`;
      const selected = selectedTeeth.includes(name);
      return (
        <Button
          key={name}
          name={name}
          color="blue"
          basic={!selected}
          size="tiny"
          // add or remove to the selected teeth
          onClick={() => {
            if (selected) {
              setSelectedTeeth(selectedTeeth.filter((tooth) => tooth !== name));
            } else {
              setSelectedTeeth([...selectedTeeth, name]);
            }
          }}
        >
          {index}
        </Button>
      );
    });
  };

  return (
    <Modal
      open={open}
      trigger={
        <List selection>
          <List.Item>
            <Label color="purple">Tooth Selector</Label>
            {selectedTeeth.sort().join(", ")}
          </List.Item>
        </List>
      }
      onClose={() => setOpen(false)}
      onOpen={() => { setOpen(true); setPreviousSelectedTeeth(selectedTeeth); }}
    >
      <Modal.Content>
        <Grid columns={2} celled="internally">
          <Grid.Row>
            <GridColumn>{renderTeethRow(true, "ul")}</GridColumn>
            <GridColumn>{renderTeethRow(false, "ur")}</GridColumn>
          </Grid.Row>
          <Grid.Row>
            <GridColumn>{renderTeethRow(true, "ll")}</GridColumn>
            <GridColumn>{renderTeethRow(false, "lr")}</GridColumn>
          </Grid.Row>
          
        </Grid>
      </Modal.Content>
      <Modal.Actions>
        <Button color="red" size="tiny" onClick={() => { setOpen(false); setSelectedTeeth(previousSelectedTeeth)}}>
          <Icon name="remove" />
          Cancel
        </Button>
        <Button color="green" size="tiny" onClick={() => { setOpen(false); onChange(selectedTeeth)}}>
          <Icon name="checkmark" />
          OK
        </Button>
        <Button floated="left" size="tiny" onClick={() => setSelectedTeeth([])}>
          <Icon name="repeat" />
          Reset
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
