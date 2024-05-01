import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const [preppedContent, setPreppedContent] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const { currentUserRoles, tenant } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");



  const canEditWorkspaceTeam = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };
  const canEditWorkspace = () => {
    return isAdmin || selectedWorkspace?.role === "Owner";
  };

  const nav = useNavigate();
  

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  const findWorkspaceById = (workspacesId) => {
    return workspaces.find((ws) => ws.workspaceId === workspacesId);
  }

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
    let ws = id ? findWorkspaceById(id) : null;
    // set 2 parents if applicable
    if (ws && ws.parentId) {
      ws.parent = findWorkspaceById(ws.parentId);
      if (ws.parent && ws.parent.parentId) {
        ws.parent.parent = findWorkspaceById(ws.parent.parentId);
      }
    }
    setSelectedWorkspace(ws);

    setIsTopLevel(!id);

    const children = workspaces.filter(ws => ws.parentId == id);
    setChildren(children);
    
  }, [workspaces, location.search]);

  useEffect(() => {
    async function prepContent(text) {
      const libraryRegex = /!\[library\]\(\/workspace\/([a-f\d-]+)\/doc\/([a-f\d-]+)\)/g;

      let match = libraryRegex.exec(text);
      while (match) {
        const workspaceId = match[1];
        const docId = match[2];

        let replacement = '';
        try {
          const result = await makeApiCall("GET", `/workspaces/${workspaceId}/docs/${docId}`);
          const { data } = result ?? {}; // result also contains workspace which we don't need here
          const { fileURL, note }= data ?? {};
          replacement = `<img alt="${note}" src="${fileURL}"/>`;
        } catch (e) {
          replacement = "library item not found";
        }
        text = text.replace(match[0], replacement);
        match = libraryRegex.exec(text);

      }

      const urlRegex = /\!\[external\]\((https?:\/\/[^\)]+)\)/g; // matches ![external](URL)
      match = urlRegex.exec(text);
      while (match) {
        const url = match[1];
        
        const replacement = `<img alt="external image" src="${url}"/>`;
        text = text.replace(match[0], replacement);

        match = urlRegex.exec(text);
      }

      return text;
    }
    async function onLoad() {
      try {
        if (!selectedWorkspace) return;

        const preppedContent = await prepContent(selectedWorkspace.note);

        setPreppedContent(preppedContent);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [selectedWorkspace]);
  const getReviewNCRsLabel = () => `Review  ${pluralize((tenant && tenant.NCRLabel) ? tenant.NCRLabel : "NCR")}`
  async function loadWorkspaces() {
    // if admin return all
    if (isAdmin) {
      return await makeApiCall("GET", `/workspaces`);
    }

    return await makeApiCall("GET", `/myworkspaces`);
  }

 
  const IconRenderer = () => {
    return (
      <Icon.Group size="large">
        <Icon name="folder" color="yellow" className="folder-icon" />
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
        sort: 'asc',
      }, 
      { field: "category", resizable: true, sortable: true },
      { field: "clientName", headerName: "Client", resizable: true, sortable: true },
      { field: "workspaceCode", headerName: "Code", resizable: true, sortable: true, sort: "asc" },
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
  function renderNote() {

    if (!preppedContent) return null;
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
            dangerouslySetInnerHTML={{ __html: preppedContent }}
          />
        </Accordion.Content>
      </Accordion>
    );
  }
  function renderWorkspace(ws) {
    const { workspaceId } = ws;
    return (<>
      <WorkspaceInfoBox
                    workspace={selectedWorkspace}
                    editable={canEditWorkspace()}
                  />

<div class="mx-auto max-w-6xl text-center p-6 dark:bg-gray-900">
    
    <div
        class="gr mx-auto max-w-5xl items-stretch space-y-4 text-left sm:flex sm:space-y-0 sm:space-x-8 sm:text-center">
        <a class="flex w-full items-center rounded-xl border border-black border-opacity-10 px-4 py-6 text-black duration-200 hover:border-opacity-0 hover:no-underline hover:shadow-lg dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 sm:flex-col sm:hover:shadow-2xl"
            href={`/workspace/${workspaceId}/registers`} >
            <img class="mr-4 w-12 sm:mr-0 sm:h-32 sm:w-32 " src="register.svg" alt="Register"/>
            <div>
                <div class="font-semibold text-black dark:text-white sm:mt-4 sm:mb-2">Register</div>
                <div class="text-sm opacity-75">Create form records or view the existing ones.
                </div>
            </div>
        </a>
        <a class="flex w-full items-center rounded-xl border border-black border-opacity-10 px-4 py-6 text-black duration-200 hover:border-opacity-0 hover:no-underline hover:shadow-lg dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 sm:flex-col sm:hover:shadow-2xl"
            href={`/workspace/${workspaceId}/tasks`} >
            
            <img class="mr-4 w-12 sm:mr-0 sm:h-32 sm:w-32 " src="task.svg" alt="Tasks"/>
            <div>
                <div class="font-semibold text-black dark:text-white sm:mt-4 sm:mb-2">Tasks</div>
                <div class="text-sm opacity-75">Manage the tasks assigned to the team members.
                </div>
            </div>
        </a>
        {canEditWorkspaceTeam() &&
        <a class="flex w-full items-center rounded-xl border border-black border-opacity-10 px-4 py-6 text-black duration-200 hover:border-opacity-0 hover:no-underline hover:shadow-lg dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 sm:flex-col sm:hover:shadow-2xl"
            href={`/workspace/${workspaceId}/team`} >
            
            <img class="mr-4 w-12 sm:mr-0 sm:h-32 sm:w-32 " src="team.svg" alt="Team"/>
            <div>
                <div class="font-semibold text-black dark:text-white sm:mt-4 sm:mb-2">Team</div>
                <div class="text-sm opacity-75">Manage team members of this workspace.
                </div>
            </div>
        </a>}
       
        <a class="flex w-full items-center rounded-xl border border-black border-opacity-10 px-4 py-6 text-black duration-200 hover:border-opacity-0 hover:no-underline hover:shadow-lg dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 sm:flex-col sm:hover:shadow-2xl"
            href={`/workspace/${workspaceId}/docs`} >
            <img class="mr-4 w-12 sm:mr-0 sm:h-32 sm:w-32 " src="library.svg" alt="Library"/>
            <div>
                <div class="font-semibold text-black dark:text-white sm:mt-4 sm:mb-2">Library</div>
                <div class="text-sm opacity-75">Reposity of all documents for this workspace (images, PDFs, etc.).
                </div>
            </div>
        </a>
        
    </div>
</div>

      <Grid verticalAlign="middle">
        <Grid.Row>
          <Grid.Column>
            {renderNote()}
            {renderChildren()}
          </Grid.Column>
        </Grid.Row>
      </Grid>
      </>
    );
  }
  function handleCurrentWorkspaceChange() {
    if (pickedWorkspace) 
      nav(`?id=${pickedWorkspace.workspaceId}`);
  }

  function render() {
    const linkToNewWorkspace = selectedWorkspace ? `/workspace?parentWorkspaceId=${selectedWorkspace.workspaceId}` : `/workspace`;
    return (
      <>
        {(!workspaces || workspaces.length == 0) && (
          <Message header="No workspaces found" icon="exclamation" />
        )}

        {selectedWorkspace
          ? renderWorkspace(selectedWorkspace)
          : renderChildren()}
        <Divider hidden />
        {isAdmin && (
          <Link to={linkToNewWorkspace}>
            <Button basic primary size="tiny">
              <Icon name="plus" />
              Workspace
            </Button>
          </Link>
        )}
        <Divider />

        <a href="/workspace/NCR/tasks">{getReviewNCRsLabel()}</a>
      </>
    );
  }
  return isLoading ? <Loader active /> : render();
}
