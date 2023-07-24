import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Divider,
  Grid,
  Icon,
  Label,
  List,
  Loader,
  Message,
  Modal,
  Segment,
  Table,
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import WorkspaceTree from "../components/WorkspaceTree";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import "./WorkspaceList.css";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const location = useLocation();


  const [isLoading, setIsLoading] = useState(true);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  const canEditWorkspace = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };
  const canEditWorkspaceTeam = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };

  const nav = useNavigate();

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadWorkspaces();
        setWorkspaces(items);
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
    const categoryParam = searchParams.get("category");
    const subCategoryParam = searchParams.get("subCategory");
    const id = searchParams.get("id");
    let ws =
      id && workspaces ? workspaces.find((ws) => ws.workspaceId === id) : null;

    // Update the category and subCategory state variables based on the URL parameters
    setCategory(categoryParam || category || ""); // Use an empty string if categoryParam is null
    setSubCategory(subCategoryParam || subCategory || ""); // Use an empty string if subCategoryParam is null
    setSelectedWorkspace(ws);

    setFilteredWorkspaces(filter(workspaces, categoryParam, subCategoryParam));
  }, [workspaces, location.search]);

  async function loadWorkspaces() {
    // if admin return all
    if (isAdmin) {
      return await makeApiCall("GET", `/workspaces`);
    }

    return await makeApiCall("GET", `/myworkspaces`);
  }

  const handleCategoryChange = (category, subCategory) => {
    nav(`?category=${category}&subCategory=${subCategory}`);
    setIsTreeOpen(false);
  };

  const filter = (workspaces, category, subCategory) => {
    if (!category || category === "ALL") {
      return workspaces;
    }

    return workspaces.filter(
      (workspace) =>
        workspace.category === category &&
        (!subCategory || subCategory === "ALL"  || workspace.subCategory === subCategory)
    );
  };

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
      { field: "subCategory", resizable: true, sortable: true },
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
  function renderWorkspacesList() {
    if (!workspaces || workspaces.length === 0) return null;

    return (
      <>
        <FormHeader heading="Workspaces" />
        <div
          className="ag-theme-balham"
          style={{
            height: "400px",
            width: "100%",
          }}
        >
          <AgGridReact
            gridOptions={gridOptions}
            rowData={filteredWorkspaces}
            rowHeight="30"
            animateRows={true}
          ></AgGridReact>
        </div>
        <Divider hidden />
        <Modal
          onClose={() => setIsTreeOpen(false)}
          onOpen={() => setIsTreeOpen(true)}
          open={isTreeOpen}
          trigger={
            <Button
              basic
              circular
              icon="list"
              color="yellow"
              size="tiny"
            />
          }
        >
          <Modal.Header>
            Select a Category or SubCategory to filter the view
          </Modal.Header>
          <Modal.Content image>
            <Modal.Description>
              <WorkspaceTree
                workspaces={workspaces}
                selectedCategory={category}
                selectedSubCategory={subCategory}
                onChange={handleCategoryChange}
              />
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button
              basic
              circular
              onClick={() => setIsTreeOpen(false)}
              icon="x"
            />
          </Modal.Actions>
        </Modal>
       
        <Divider hidden />
        {isAdmin && (
          <LinkContainer to={`/workspace`}>
            <Button basic primary size="tiny">
              <Icon name="plus" />
              Workspace
            </Button>
          </LinkContainer>
        )}
      </>
    );
  }
  const WorkspaceInfoBox = ({ workspace, canEdit }) => {
    const {
      workspaceId,
      workspaceName,
      workspaceStatus,
      category,
      subCategory,
      clientName,
      startDate,
      endDate,
      note,
    } = workspace;
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
      return formattedDate === "Invalid Date" ? "" : formattedDate;
    };

    const handleEditButtonClick = () => {
      nav(`/workspace/${workspaceId}`);
    };
    const getStatusColor = () => {
      switch (workspaceStatus) {
        case "Completed":
          return "green";
      
        case "Blocked":
          return "red";
      
        case "Cancelled":
          return "pink";
      
        default:
          return "default"
      }
    }

    return (
      <Segment size="small" style={{ marginTop: "75px" }}>
        <Label ribbon>
          Workspace Information
        </Label>
        {canEdit && (
          <Button
            basic
            circular
            size="tiny"
            icon="edit"
            floated="right"
            onClick={handleEditButtonClick}
          />
        )}
        <Table basic="very" celled>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <strong>Name:</strong>
              </Table.Cell>
              <Table.Cell>{workspaceName}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Status:</strong>
              </Table.Cell>
              <Table.Cell><Label color={getStatusColor()}>{workspaceStatus}</Label></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Category:</strong>
              </Table.Cell>
              <Table.Cell>{category}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Sub Category:</strong>
              </Table.Cell>
              <Table.Cell>{subCategory}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Client Name:</strong>
              </Table.Cell>
              <Table.Cell>{clientName}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Start Date:</strong>
              </Table.Cell>
              <Table.Cell>{formatDate(startDate)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>End Date:</strong>
              </Table.Cell>
              <Table.Cell>{formatDate(endDate)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <strong>Note:</strong>
              </Table.Cell>
              <Table.Cell>{note}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
    );
  };
  function renderWorkspace(ws) {
    const { workspaceName, workspaceId } = ws;
    return (
      <Grid verticalAlign="middle">
        <Grid.Row>
          <Grid.Column width={1}></Grid.Column>
          <Grid.Column width={13}>
            <Button
              basic
              circular
              size="tiny"
              onClick={() =>
                nav(`?category=${category}&subCategory=${subCategory}`)
              }
              icon="level up alternate"
            />
            <Icon name="folder open" color="yellow" size="large" />
            {workspaceName}
          </Grid.Column>
        </Grid.Row>{" "}
        <Grid.Row>
          <Grid.Column width={2}></Grid.Column>
          <Grid.Column width={14}>
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
            </List>

            <WorkspaceInfoBox workspace={ws} canEdit={canEditWorkspace()} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
  function render() {
    return (
      <>
        {(!workspaces || workspaces.length == 0) && (
          <Message header="No workspaces found" icon="exclamation" />
        )}
        {selectedWorkspace
          ? renderWorkspace(selectedWorkspace)
          : renderWorkspacesList()}
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}
