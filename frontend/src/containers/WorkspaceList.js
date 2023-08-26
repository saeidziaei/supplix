import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  Button,
  Divider,
  Grid,
  Icon,
  List,
  Loader,
  Message,
  Modal
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import WorkspacePicker from '../components/WorkspacePicker';
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import "./WorkspaceList.css";


export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [children, setChildren] = useState([]);
  const [isTopLevel, setIsTopLevel] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const location = useLocation();
  const [pickedWorkspace, setPickedWorkspace] = useState(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");


  const canEditWorkspaceTeam = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };
  const canEditWorkspace = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };

  const nav = useNavigate();
  

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      try {
        const workspaces = await loadWorkspaces();
        // if a user is a member of a ws but not a member of that ws's parent, we just show that we at the root by setting the parentId to null
        const userWorkspaces = workspaces.map((ws) => ({
          ...ws,
          parentId: ws.parentId && workspaces.some((item) => item.workspaceId === ws.parentId)
            ? ws.parentId
            : null,
        }));
        setWorkspaces(userWorkspaces);
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false);
      }
    }

    onLoad();
  }, []);

  useEffect(() => {
    // Extract the category and subCategory parameters from the URL
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("id");
    if (!workspaces) {
      setSelectedWorkspace(null);
      setChildren([]);
      return;
    }
    let ws = id ? workspaces.find((ws) => ws.workspaceId === id) : null;
    setSelectedWorkspace(ws);

    setIsTopLevel(!id);

    const children = workspaces.filter(ws => ws.parentId == id);
    setChildren(children);
    
  }, [workspaces, location.search]);

  async function loadWorkspaces() {
    // if admin return all
    if (isAdmin) {
      return await makeApiCall("GET", `/workspaces`);
    }

    return await makeApiCall("GET", `/myworkspaces`);
  }

 
  const IconRenderer = () => {
    return (
      <Icon.Group size="big">
        <Icon name="folder" color="yellow" />
      </Icon.Group>
    );
  };
  const gridOptions = {
    columnDefs: [
      {
        field: "Icon",
        headerName: "",
        width: 60,
        cellRenderer: IconRenderer,
      },
      {
        field: "workspaceName",
        headerName: "Workspace",
        resizable: true,
        sortable: true,
      }, 
      { field: "category", resizable: true, sortable: true },
      { field: "workspaceCode", headerName: "Code", resizable: true, sortable: true },
      { field: "workspaceStatus", headerName: "Status", resizable: true, sortable: true },
    ],
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
    onSelectionChanged: onSelectionChanged,
  };
  function onSelectionChanged() {
    const selectedRows = gridOptions.api.getSelectedRows();
    const ws = selectedRows.length === 1 ? selectedRows[0] : null;
    if (ws) {
      nav(`?id=${ws.workspaceId}`);
    }
  }
  function renderChildren() {
    if (!children || children.length === 0) return null;

    return (
      <>
        <FormHeader heading={isTopLevel ? "Workspaces" : "Associated Workspaces"} />
        
        <div
          className="ag-theme-balham"
          style={{
            height: "300px",
            width: "100%",
          }}
        >
          <AgGridReact
            gridOptions={gridOptions}
            rowData={children}
            rowHeight="30"
            animateRows={true}
          ></AgGridReact>
        </div>
        
      </>
    );
  }
  function renderNote(note) {
    if (!note) return null;
    return (
      <Accordion fluid>
        <Accordion.Title
          active={isNoteExpanded}
          index={1}
          onClick={() => setIsNoteExpanded(!isNoteExpanded)}
        >
          <Icon name="dropdown" />
          Note
        </Accordion.Title>
        <Accordion.Content active={isNoteExpanded}>
          <div
            className="markdown"
            dangerouslySetInnerHTML={{ __html: selectedWorkspace.note }}
          />
        </Accordion.Content>
      </Accordion>
    );
  }
  function renderWorkspace(ws) {
    const { workspaceId } = ws;
    return (
      <Grid verticalAlign="middle">
        <Grid.Row>
          <Grid.Column>
            <List divided relaxed>
              <List.Item
                as="a"
                onClick={() => nav(`/workspace/${workspaceId}/registers`)}
              >
                <List.Icon name="folder" color="yellow" size="large" />
                Register
              </List.Item>
              <List.Item
                as="a"
                onClick={() => nav(`/workspace/${workspaceId}/docs`)}
              >
                <List.Icon name="folder" color="yellow" size="large" />
                Library
              </List.Item>
              {canEditWorkspaceTeam() && (
                <List.Item
                  as="a"
                  onClick={() => nav(`/workspace/${workspaceId}/team`)}
                >
                  <List.Icon name="folder" color="yellow" size="large" />
                  Team
                </List.Item>
              )}

              <List.Item
                as="a"
                onClick={() => nav(`/workspace/${workspaceId}/tasks`)}
              >
                <List.Icon name="folder" color="yellow" size="large" />
                Tasks
              </List.Item>
            </List>
            {renderNote(selectedWorkspace.note)}
            {renderChildren()}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
  function handleCurrentWorkspaceChange() {
    if (pickedWorkspace) 
      nav(`?id=${pickedWorkspace.workspaceId}`);
  }

  function renderModalWorkspacePicker() {
    return ( <Modal
      onClose={() => setIsTreeOpen(false)}
      onOpen={() => setIsTreeOpen(true)}
      open={isTreeOpen}
      trigger={
        <Icon
          className="clickable"
          fitted
          name="list"
          color="yellow"
          size="large"
        />
      }
    >
      <Modal.Header>Select a Workspace</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
          <WorkspacePicker
            workspaces={workspaces}
            allowNull={false}
            onChange={(ws) => setPickedWorkspace(ws)}
          />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          basic
          circular
          color="green"
          size="tiny"
          onClick={() => {
            setIsTreeOpen(false);
            handleCurrentWorkspaceChange();
          }}
          icon="check"
        />
        <Button
          basic
          circular
          onClick={() => setIsTreeOpen(false)}
          icon="x"
        />
      </Modal.Actions>
    </Modal>);
  }
  function render() {
    return (
      <>
        {(!workspaces || workspaces.length == 0) && (
          <Message header="No workspaces found" icon="exclamation" />
        )}
        <Grid stackable>
          <Grid.Row>
            <Grid.Column width={1}>
              <List relaxed>
                <List.Item>
                  <Icon
                    className="clickable"
                    color="grey"
                    name="arrow left"
                    size="large"
                    style={{ marginLeft: "10px" }}
                    onClick={() => nav(-1)}
                  />
                </List.Item>
                <List.Item>{renderModalWorkspacePicker()}</List.Item>
              </List>
            </Grid.Column>
            <Grid.Column width={14}>
              {selectedWorkspace ? (
                <>
                  <WorkspaceInfoBox
                    workspace={selectedWorkspace}
                    editable={canEditWorkspace()}
                  />
                  {renderWorkspace(selectedWorkspace)}
                </>
              ) : (
                <>
                  {renderChildren()}
                  <Divider hidden />
                  {isAdmin && (
                    <LinkContainer to={`/workspace`}>
                      <Button basic primary size="tiny">
                        <Icon name="plus" />
                        Workspace
                      </Button>
                    </LinkContainer>
                  )}
                  <Divider />
                 
                 <a href="/workspace/NCR/tasks">Review NCRs</a>
                </>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}
