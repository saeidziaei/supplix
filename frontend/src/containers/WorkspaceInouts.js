import React, { useEffect, useState, useCallback } from "react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { useParams } from "react-router-dom";
import { makeApiCall } from "../lib/apiLib";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInHours, isBefore } from "date-fns";
import { onError } from "../lib/errorLib";
import { useAppContext } from "../lib/contextLib";
import User from "../components/User";
import WorkspacePicker from "../components/WorkspacePicker";
import { Modal, Label, Button, Loader, Grid } from  "semantic-ui-react";
import { dateFromEpoch } from "../lib/helpers";
import DateInput from "../components/DateInput";

export default function WorkspaceInouts() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState(null);
  const [inouts, setInouts] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );  
  const [isLoading, setIsLoading] = useState(true);
  const [isInoutLoading, setIsInoutLoading] = useState(true);
  const [isWsPickerOpen, setIsWsPickerOpen] = useState(false);
  const [pickedWorkspace, setPickedWorkspace] = useState(null);
  const { users } = useAppContext();

  ModuleRegistry.registerModules([ClientSideRowModelModule]);


  const loadWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await makeApiCall("GET", `/workspaces`);
      setWorkspaces(list);

      if (workspaceId) {
        const current = list.find((w) => w.workspaceId === workspaceId);
        setWorkspace(current);
      }
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const loadWorkspaceInouts = useCallback(async () => {
    if (!workspace) return;

    try {
      setIsInoutLoading(true);
      const inouts = await makeApiCall(
        "GET",
        `/workspaces/${workspace.workspaceId}/inouts?effectiveDate=${formattedDate}`
      );

      setInouts(inouts?.data || []);
    } catch (e) {
      onError(e);
    } finally {
      setIsInoutLoading(false);
    }
  }, [workspace, formattedDate]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadWorkspaceInouts();
  }, [workspace, formattedDate, loadWorkspaceInouts]);

  const UserRenderer = (params) => {
    const fieldName = params.colDef.field;
    const user = users
      ? users.find((u) => u.Username === params.data[fieldName])
      : null;
    if (!user) return;
    return <User user={user} compact={true} />;
  };
  const InoutStatusRenderer = ({ data }) => {
    let onSite  = false;
    let timeBreach = false;
    let text = "Unknown Status";
    let color = "bg-gray-400";

    const inAt = data["inAt"];
    const outAt = data["outAt"];


    if (outAt) {
      onSite = false;
      timeBreach = differenceInHours(new Date(outAt), new Date(inAt)) > 24;

    } else {
      onSite = true;
      timeBreach = differenceInHours(new Date(), new Date(inAt)) > 24;
    }

    color = timeBreach ? "bg-red-500" : onSite ? "bg-green-500" : "bg-gray-400";
    text = onSite ? "On Site" : "Left Site"
  

  
    // Default (gray circle if none of the above conditions match)
    return (
      <div className="flex items-center mt-2">
        <div className={`h-4 w-4 rounded-full mr-2 ${color}`}></div>
        <span className="text-sm">{text}</span>
        {timeBreach && (
        <span className="ml-2 text-xs text-gray-500">(24+ Hours)</span>
      )}
      </div>
    );
  };
  const DateTimeRenderer = (params) => {
    try {
      const fieldName = params.colDef.field;

      const date = dateFromEpoch(params.data[fieldName]);
      if (date == "Invalid Date") return "";

      return format(date, "dd-MMM-yyyy   HH:mm");
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
        color="yellow"
        size="tiny"
      >
        {workspace ? workspace.workspaceName : "-"}
      </Label>
    );
  };

  const gridOptions = {
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      width: 160,
    },
    columnDefs: [
      { field: "workspace", headerName: "Workspace", width: 150,cellRenderer: WorkspaceRenderer, }, 
      {
        field: "userId",
        headerName: "User",
        cellRenderer: UserRenderer,
        width: 90,
      },
      { headerName: "Status", cellRenderer: InoutStatusRenderer  },
      { field: "inAt", headerName: "Sign In", cellRenderer: DateTimeRenderer  },
      { field: "outAt", headerName: "Sign Out", cellRenderer: DateTimeRenderer },
    ],
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
  };

  if (isLoading) return <Loader active />;

  return (
<div className="max-w-4xl mx-auto p-6">

    <div>
      <div className="flex items-center justify-between rounded-md p-4 border border-gray-300 my-4">

      <div className="col-span-6 md:col-span-2 px-0 md:px-3">
                          <DateInput
                            
                            name="effectiveDate"
                            value={effectiveDate}
                            onChange={(date) => {
                              setEffectiveDate(date);
                              if (date) {
                                setFormattedDate(format(date, "yyyy-MM-dd"));
                              } else {
                                setFormattedDate("");
                              }
                            }}
                          />
                        </div>
<div>
<Modal className="col-span-6 md:col-span-2 px-0 md:px-3"
        onClose={() => setIsWsPickerOpen(false)}
        onOpen={() => setIsWsPickerOpen(true)}
        open={isWsPickerOpen}
        trigger={
          <Button
            style={{ marginBottom: "20px" }}
            color="yellow"
            content="Workspace"
            icon="list"
            label={{
              basic: true,
              color: "yellow",
              pointing: "left",
              content: `${workspace ? workspace.workspaceName : "-"}`,
            }}
            onClick={(e) => {
              e.preventDefault();
            }}
          />
        }
      >
        <Modal.Header>Select Workspace</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <WorkspacePicker
              workspaces={workspaces}
              allowNull={true}
              onChange={(selecte) => setPickedWorkspace(selecte)} // doesn't set the workspace, just sets state
              selectedWorkspaceId={workspaceId || workspace.workspaceId}
            />
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Label>
            Selected: {workspace ? workspace.workspaceName : "(none)"}
          </Label>
          <Button
            basic
            circular
            color="green"
            size="tiny"
            onClick={() => {
              setIsWsPickerOpen(false);
              setWorkspace(pickedWorkspace);
            }}
            icon="check"
          />
          <Button
            color="red"
            size="tiny"
            basic
            circular
            onClick={() => {
              setIsWsPickerOpen(false);
            }}
            icon="x"
          />
        </Modal.Actions>
      </Modal>
</div>
</div>

      {isInoutLoading ? (
        <p>Loading data ...</p>
      ) : (
        <div>
          <div
            key="tasks"
            className="ag-theme-balham"
            style={{
              height: "350px",
              width: "100%",
            }}
          >
            <AgGridReact
              gridOptions={gridOptions}
              rowData={inouts}
              rowHeight="30"
              animateRows={true}
            ></AgGridReact>
          </div>

        </div>
      )}
    </div>
    </div>
  );
}
