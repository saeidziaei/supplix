import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Label, Icon, Table, Accordion, Breadcrumb, Modal } from "semantic-ui-react";
import "./NCR.css"

export const NCR = ({ workspaces, workspace, editable }) => {
  const nav = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const canEdit = editable || workspace?.role === "Owner";


 

  function renderModelNCR() {
    return ( <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={
        <span className="clickable ncr">NCR</span>
      }
    >
      <Modal.Header>Select a Workspace</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
TODO
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          basic
          circular
          color="green"
          size="tiny"
          onClick={() => {
            setIsOpen(false);
            
          }}
          icon="check"
        />
        <Button
          basic
          circular
          onClick={() => setIsOpen(false)}
          icon="x"
        />
      </Modal.Actions>
    </Modal>);
  }
  
  return renderModelNCR();
   
};
