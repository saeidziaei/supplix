import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Divider, Header, Icon, Label, Loader, Menu, Radio, Segment, Tab } from "semantic-ui-react";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";


import User from "../components/User";
import { dateFromEpoch } from "../lib/helpers";
import "./FormRegisters.css";
import { useAppContext } from "../lib/contextLib";


export default function WorkspaceTasks() {
  const NCR_WORKSPACE_ID = "NCR";

  const { workspaceId, username } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [recurringTasks, setRecurringTasks] = useState(null); 
  const [selectedTask, setSelectedTask] = useState(null);
  const nav = useNavigate();
  const location = useLocation();
  const [showAll, setShowAll] = useState(false);
  const { users } = useAppContext();

  // this component is used for multiple paths, determining what needs to be rendered based on path
  const isMytasksPath = location.pathname === "/mytasks";
  const isUserTasksPath = location.pathname.startsWith("/user/");
  
  const isMultiWorkspace = isMytasksPath || isUserTasksPath;

  const isNCR = () => workspaceId === NCR_WORKSPACE_ID;
  const canManageRecurringTasks = () =>
    !isNCR() && workspace && workspace.role === "Owner";

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      async function loadWorkspaceTasks() {
        return await makeApiCall(
          "GET",
          `/workspaces/${workspaceId}/tasks` + (showAll ? `?showAll=true` : "")
        );
      }
      async function loadMyTasks() {
        return await makeApiCall(
          "GET",
          `/mytasks` + (showAll ? `?showAll=true` : "")
        );
      }
      async function loadUserTasks() {
        return await makeApiCall(
          "GET",
          `/users/${username}/tasks` + (showAll ? `?showAll=true` : "")
        );
      }

      async function loadWorkspaces() {
        return await makeApiCall("GET", `/workspaces`);
      }

      async function loadTasks() {
        if (isMytasksPath) return await loadMyTasks();
        if (isUserTasksPath) return await loadUserTasks();
        return await loadWorkspaceTasks();
      }

      try {
        setIsLoading(true);

        const [tasks, workspaces] = await Promise.all([
          loadTasks(),
          isMultiWorkspace ? loadWorkspaces() : [], // no need to load all workspaces if it is showing tasks for one workspace
        ]);

        if (isMultiWorkspace) {
          setTasks(tasks);
          setWorkspaces(workspaces);
        } else {
          // for GET workspacetasks workspaceId is in the path therefore result are in data element and it also returns workspace
          const { data, workspace } = tasks ?? {};

          setTasks(data.filter((t) => !t.isRecurring || t.isRecurring === "N"));
          setRecurringTasks(
            data.filter((t) => t.isRecurring && t.isRecurring === "Y")
          );
          setWorkspace(workspace);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, [showAll, isMytasksPath, isUserTasksPath, users]);
  const UserRenderer = (params) => {
    const fieldName = params.colDef.field;
    const user = users
      ? users.find((u) => u.Username === params.data[fieldName])
      : null;
    if (!user) return;
    return <User user={user} compact={true} />;
  };
  const DateRenderer = (params) => {
    try {
      const fieldName = params.colDef.field;

      const date = dateFromEpoch(params.data[fieldName]);
      if (date == "Invalid Date") return "";

      return format(date, "dd/MM/yy");
    } catch {
      return "";
    }
  };
  const WorkspaceRenderer = (params) => {
    const workspaceId = params.data["workspaceId"];
    const workspace = workspaces
      ? workspaces.find((w) => w.workspaceId === workspaceId)
      : {};
    return (
      <Label
        horizontal
        color={workspaceId === NCR_WORKSPACE_ID ? "red" : "yellow"}
        size="tiny"
      >
        {workspace ? workspace.workspaceName : "-"}
      </Label>
    );
  };
  const StatusRenderer = (params) => {
    const taskStatus = params.data["taskStatus"];
    let color = "grey";
    switch (taskStatus) {
      case "Completed":
        color = "green";
        break;

      case "On Hold":
        color = "orange";
        break;

      case "Cancelled":
        color = "red";
        break;

      case "In Progress":
        color = "teal";
        break;

      default:
        break;
    }

    return (
      <Label size="tiny" horizontal basic color={color}>
        {taskStatus || "Unknown"}
      </Label>
    );
  };
  const tasksGridOptions = {
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      width: 120,
    },
    columnDefs: [
      isMultiWorkspace
        ? {
            field: "workspace",
            headerName: "Workspace",
            width: 150,
            cellRenderer: WorkspaceRenderer,
          }
        : {},
      { field: "taskCode", headerName: "Code", width: 70 },
      { field: "taskType", headerName: "Type", width: 70 },
      { field: "taskName" },
      { field: "startDate", cellRenderer: DateRenderer, width: 90 },
      { field: "dueDate", cellRenderer: DateRenderer, width: 90 },
      { field: "completionDate", cellRenderer: DateRenderer, width: 90 },
      {
        field: "taskStatus",
        headerName: "Status",
        cellRenderer: StatusRenderer,
      },
      {
        field: "userId",
        headerName: "Owner",
        cellRenderer: UserRenderer,
        width: 90,
      },
      {
        field: "createdBy",
        headerName: "Reporter",
        cellRenderer: UserRenderer,
        width: 90,
      },
      {
        field: "updatedBy",
        headerName: "Updated",
        cellRenderer: UserRenderer,
        width: 90,
      },
    ].filter((def) => def.field), // remove empty objects
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
    onSelectionChanged: onTasksSelectionChanged,
  };
  const recurringTasksGridOptions = {
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      width: 120,
    },
    columnDefs: [
      { field: "frequency", width: 150 },
      { field: "taskCode", headerName: "Code", width: 70 },
      { field: "taskType", headerName: "Type", width: 70 },
      { field: "taskName" },
      { field: "startDate", cellRenderer: DateRenderer, width: 90 },
      { field: "endDate", cellRenderer: DateRenderer, width: 90 },
      {
        field: "userId",
        headerName: "Owner",
        cellRenderer: UserRenderer,
        width: 90,
      },
      {
        field: "createdBy",
        headerName: "Reporter",
        cellRenderer: UserRenderer,
        width: 90,
      },
      {
        field: "updatedBy",
        headerName: "Updated",
        cellRenderer: UserRenderer,
        width: 90,
      },
    ],
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
    onSelectionChanged: onRecurringTasksSelectionChanged,
  };

  function onTasksSelectionChanged() {
    const selectedRows = tasksGridOptions.api.getSelectedRows();
    const t = selectedRows.length === 1 ? selectedRows[0] : null;
    setSelectedTask(t);
  }

  function onRecurringTasksSelectionChanged() {
    const selectedRows = recurringTasksGridOptions.api.getSelectedRows();
    const t = selectedRows.length === 1 ? selectedRows[0] : null;
    setSelectedTask(t);
  }

  const handleCompletedToggle = () => {
    setShowAll(!showAll);
  };

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
            nav(
              `/workspace/${selectedTask.workspaceId}/task/${selectedTask.taskId}`
            )
          }
        />
        <Header>{selectedTask.taskName}</Header>
        <div
          className="markdown"
          dangerouslySetInnerHTML={{ __html: selectedTask.note }}
        />
      </Segment>
    );
  };
  const panes = [
    {
      menuItem: "Tasks",
      render: () => (
        <Tab.Pane attached={false}>
          <div
            key="tasks"
            className="ag-theme-balham"
            style={{
              height: "350px",
              width: "100%",
            }}
          >
            <AgGridReact
              gridOptions={tasksGridOptions}
              rowData={tasks}
              rowHeight="30"
              animateRows={true}
            ></AgGridReact>
          </div>
          <Segment basic>
            <Checkbox
              toggle
              label="Show Closed Tasks"
              onChange={handleCompletedToggle}
              checked={showAll}
            />
          </Segment>
        </Tab.Pane>
      ),
    },
    canManageRecurringTasks()
      ? {
          menuItem: "Recurring Tasks",
          render: () => (
            <Tab.Pane attached={false}>
              <div
                key="recurring-tasks"
                className="ag-theme-balham"
                style={{
                  height: "300px",
                  width: "100%",
                }}
              >
                <AgGridReact
                  gridOptions={recurringTasksGridOptions}
                  rowData={recurringTasks}
                  rowHeight="30"
                  animateRows={true}
                ></AgGridReact>
              </div>
            </Tab.Pane>
          ),
        }
      : null,
  ];
  const getHeader = () => {
    if (isMytasksPath) return <Header>My Tasks</Header>;
    if (isUserTasksPath) {
      const user = users ? users.find((u) => u.Username === username) : null;

      return (
        <>
          <Header>User Tasks</Header>
          {user && <User  user={user} />}
        </>
      );
    }

    if (isNCR()) return "";
    return <WorkspaceInfoBox workspace={workspace} />;
  };
  function render() {
    return (
      <>
        {getHeader()}
        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />

        {renderSelectedTask()}
        <Divider hidden />
        {!isMultiWorkspace && (
          <LinkContainer to={`/workspace/${workspaceId}/task`}>
            <Button basic size="tiny" color={isNCR() ? "red" : "blue"}>
              <Icon name="plus" />
              New
            </Button>
          </LinkContainer>
        )}
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}