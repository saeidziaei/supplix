import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Divider, Header, Icon, Label, Loader, Segment } from "semantic-ui-react";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";


import User from "../components/User";
import { normaliseCognitoUsers } from "../lib/helpers";
import "./FormRegisters.css";


export default function WorkspaceTasks() {
  const NCR_WORKSPACE_ID = "NCR";  

  const { workspaceId, templateId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const nav = useNavigate();
  const location = useLocation();

  // this component is used for multiple paths, determining what needs to be rendered based on path
  const isMytasksPath = location.pathname === "/mytasks"

  const isNCR = () => workspaceId === NCR_WORKSPACE_ID;

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      async function loadWorkspaceTasks() {
        return await makeApiCall("GET", `/workspaces/${workspaceId}/tasks`);
      }
      async function loadMyTasks() {
        return await makeApiCall("GET", `/mytasks`);
      }
      async function loadUsers() {
        return await makeApiCall("GET", `/users`); 
      }      
      async function loadWorkspaces() {
        return await makeApiCall("GET", `/workspaces`); 
      }
      
      try {
        setIsLoading(true);

        const [tasks, users, workspaces] = await Promise.all([
          isMytasksPath ? loadMyTasks() : loadWorkspaceTasks(),
          loadUsers(),
          isMytasksPath ? loadWorkspaces() : [], // no need to load all workspace if it is showing tasks for one workspace
        ]);
        
        setUsers(normaliseCognitoUsers(users));

        if (isMytasksPath) {
          setTasks(tasks);
          setWorkspaces(workspaces);
        } else {
          // for GET workspacetasks workspaceId is in the path therefore result are in data element and it also returns workspace
          const { data, workspace } = tasks ?? {};

          setTasks(data);
          setWorkspace(workspace);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, []);
  const UserRenderer = (params) => {
    const fieldName = params.colDef.field;
    const user = users ? users.find((u) => u.Username === params.data[fieldName]) : null;
    if (!user) return;
    return (
      <User user={user} compact={true}  />
    );
  };
  const DateRenderer = (params) => {
    const fieldName = params.colDef.field;
    
    const date = parseISO(params.data[fieldName]);
    if (date == "Invalid Date") return "";

    return format(date, 'dd/MM/yy');
  };
  const WorkspaceRenderer = (params) => {
    const workspaceId = params.data["workspaceId"];
    const workspace = workspaces ? workspaces.find(w => w.workspaceId == workspaceId) : {};
    return (<Label color={workspaceId === NCR_WORKSPACE_ID ? "red" : "yellow"} size="tiny">{workspace ? workspace.workspaceName : workspaceId}</Label>);
  }
  const originalColumnDefs = [
    { field: "taskCode", headerName: "Code", width: 70 },
    { field: "taskType", headerName: "Type", width: 70 },
    { field: "taskName", },
    { field: "startDate", cellRenderer: DateRenderer, width: 90 },
    { field: "dueDate", cellRenderer: DateRenderer, width: 90 },
    { field: "completionDate", cellRenderer: DateRenderer, width: 90 },
    { field: "taskStatus", headerName: "Status" },
    {
      field: "userId",
      headerName: "Owner",
      cellRenderer: UserRenderer, 
      width: 90
    },
    {
      field: "createdBy",
      headerName: "Reporter",
      cellRenderer: UserRenderer,
      width: 90
    },
    {
      field: "updatedBy",
      headerName: "Updated",
      cellRenderer: UserRenderer,
      width: 90
    },
    
  ];
  const gridOptions = {
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      width: 120,
    },
    columnDefs: isMytasksPath
      ? [
          { field: "workspace", headerName: "Workspace", width: 150, cellRenderer: WorkspaceRenderer },
          ...originalColumnDefs,
        ]
      : originalColumnDefs,
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
    onSelectionChanged: onSelectionChanged,
  };

  function onSelectionChanged() {
    const selectedRows = gridOptions.api.getSelectedRows();
    const t = selectedRows.length === 1 ? selectedRows[0] : null;
    setSelectedTask(t);
  }
  const renderSelectedTask = () => {
    if (!selectedTask) return null;
    return (
      <Segment>
        <Button
          basic
          circular
          size="tiny"
          icon="edit"
          floated="right"
          onClick={() =>
            nav(`/workspace/${workspaceId}/task/${selectedTask.taskId}`)
          }
        />
        <Header>{selectedTask.taskName}</Header>
        <div
          className="markdown"
          dangerouslySetInnerHTML={{ __html: selectedTask.note }}
        />
      </Segment>
    );
  }

  function render() {
    return (
      <>
        {isMytasksPath ? (
          <Header>My Tasks</Header>
        ) : (
          <WorkspaceInfoBox workspace={workspace} />
        )}
        <div
          className="ag-theme-balham"
          style={{
            height: "300px",
            width: "100%",
          }}
        >
          <AgGridReact
            gridOptions={gridOptions}
            rowData={tasks}
            rowHeight="30"
            animateRows={true}
          ></AgGridReact>
        </div>
        {renderSelectedTask()}
        <Divider hidden />
        {!isMytasksPath && (
          <LinkContainer to={`/workspace/${workspaceId}/task`}>
            <Button basic size="tiny" color={isNCR() ? "red" : "blue"}>
              <Icon name="plus" />
              {isNCR() ? "NCR Item" : "Task"}
            </Button>
          </LinkContainer>
        )}
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}