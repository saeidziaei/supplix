import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Divider, Header, Icon, Loader, Segment } from "semantic-ui-react";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";


import User from "../components/User";
import { normaliseCognitoUsers } from "../lib/helpers";
import "./FormRegisters.css";


export default function WorkspaceTasks() {
  const { workspaceId, templateId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const nav = useNavigate();

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      async function loadTasks() {
        return await makeApiCall("GET", `/workspaces/${workspaceId}/tasks`);
      }
      async function loadUser() {
        return await makeApiCall("GET", `/users`); 
      }
      
      try {
        setIsLoading(true);

        const [tasks, users] = await Promise.all([loadTasks(), loadUser()]);

        //  has workspaceId in the path therefore result are in data element and it also returns workspace
        const { data, workspace } = tasks ?? {};

        setTasks(data);
        setWorkspace(workspace);
        setUsers(normaliseCognitoUsers(users));
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
  const gridOptions = {
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      width: 120
    },
    columnDefs: [
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
        headerName: "Reported",
        cellRenderer: UserRenderer,
        width: 90
      },
      {
        field: "updatedBy",
        headerName: "Updated",
        cellRenderer: UserRenderer,
        width: 90
      },
      
    ],
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
        <WorkspaceInfoBox workspace={workspace} />
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
        <LinkContainer to={`/workspace/${workspaceId}/task`}>
          <Button basic primary size="tiny">
            <Icon name="plus" />
            Task
          </Button>
        </LinkContainer>
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}