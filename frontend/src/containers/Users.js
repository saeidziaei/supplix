import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import React, { useEffect, useRef, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Button, Divider, Icon, Image, Loader, Message } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import placeholderImage from '../fileplaceholder.jpg';
import { makeApiCall } from "../lib/apiLib";
import { s3Get } from "../lib/awsLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter, normaliseCognitoUsers } from "../lib/helpers";
import "./Users.css";
import User from "../components/User";

export default function Users() {
  const gridRef = useRef();
  const { tenantId } = useParams(null);
  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');

  class NameRenderer {
    init(params) {
      const user = params.data;      
      this.eGui = document.createElement('div');
      this.eGui.classList.add('custom-element');
      this.eGui.innerHTML = `
          <a href="${tenantId ? `/tenants/${tenantId}/user/${user.Username}`: `/user/${user.Username}`}">${capitalizeFirstLetter(user.given_name)} ${capitalizeFirstLetter(user.family_name)} ${user.isAdmin ? "<strong>(Admin)</strong>" : ""}</a>
      `;
    }
  
    getGui() {
      return this.eGui;
    }
  
    refresh(params) {
      return false;
    }
  }
  const UserRegisterRenderer = (params) => {
    // TODO path should be user/:username/register , right?!
    return <a href={`/user/register/${params.data.Username}`}>Details</a>
  }
  const UserTasksRenderer = (params) => {
    return <a href={`/user/${params.data.Username}/tasks`}>Tasks</a>
  }
  class EmailRenderer {
    init(params) {
      this.eGui = document.createElement('div');
      this.eGui.classList.add('custom-element');
      this.eGui.innerHTML = `<a href="mailto:${params.data.email}">${params.data.email}</a>`;
    }
  
    getGui() {
      return this.eGui;
    }
  
    refresh(params) {
      return false;
    }
  }  
  const PhotoRenderer = (params) => {
    return (
      <User user={params.data} compact="true" />
    );
  };


  const columnDefs = [
    { field: 'Photo', headerName: 'Photo', width: '80', cellRenderer: PhotoRenderer},
    { field: 'Name', headerName: 'Name', resizable: true, sortable: true, cellRenderer: NameRenderer, valueGetter: (params) => {return params.data.given_name + " " + params.data.family_name}  },
    { field: 'employeeNumber', resizable: true, sortable: true },
    { field: 'email', headerName: 'Email', resizable: true, sortable: true, cellRenderer: EmailRenderer  },
    { field: 'register', headerName: 'Register', resizable: false, sortable: false, cellRenderer: UserRegisterRenderer  },
    { field: 'tasks', headerName: 'Tasks', resizable: false, sortable: false, cellRenderer: UserTasksRenderer  },
  ];

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      try {
        const [users, tenant] = await Promise.all([loadUsers(), loadTenant()]);

        setUsers(normaliseCognitoUsers(users));
        
        setTenant(tenant);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [tenantId]);

  async function loadTenant() {
    let tenant = null;

    if (tenantId) {
      tenant = await makeApiCall("GET", `/tenants/${tenantId}`);

      if (tenant && tenant.logo) {
        tenant.logoURL = await s3Get(tenant.logo);
      }
    }
    return tenant;
  }

  async function loadUsers() {
    if (tenantId) {
      return await makeApiCall("GET", `/tenants/${tenantId}/users`); // TOP LEVEL ADMIN
    } else {
      return await makeApiCall("GET", `/users`); // ADMIN
    }
  }

  function renderUserCards() {
    return (
      <div className="user-cards-container">
        {users.map(user => (
          <div key={user.Username} className="user-card">
            <div className="user-image-container">
              <div className="user-image">
                <User user={user} />
              </div>
            </div>
            <div className="user-card-content">
              <div className="user-card-info">
                <div className="user-name">
                  <a href={tenantId ? `/tenants/${tenantId}/user/${user.Username}`: `/user/${user.Username}`}>
                    {capitalizeFirstLetter(user.given_name)} {capitalizeFirstLetter(user.family_name)} 
                    {user.isAdmin && <span style={{marginLeft: '0.5rem', color: '#666'}}>(Admin)</span>}
                  </a>
                </div>
                <div className="user-email">
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                </div>
                {user.employeeNumber && (
                  <div className="user-email">
                    Employee ID: {user.employeeNumber}
                  </div>
                )}
              </div>
              <div className="user-card-actions">
                <a href={`/user/register/${user.Username}`}>
                  <Icon name="id card" />
                  Register
                </a>
                <a href={`/user/${user.Username}/tasks`}>
                  <Icon name="tasks" />
                  Tasks
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderUsers() {
    return (
      <>
        <FormHeader heading="Employees" />
        {!users && (
          <Message
            header="No user found"
            content="Start by creating your first user!"
            icon="exclamation"
          />
        )}

        {tenant && (
          <Message
            icon="users"
            content={`You are viewing users of ${tenant.tenantName}`}
          />
        )}
        {tenant && tenant.logoURL && (
          <Image
            src={tenant.logoURL}
            size="small"
            rounded
            alt="Logo"
            onError={(e) => {
              e.target.src = placeholderImage;
            }}
          />
        )}

        <Button.Group size="tiny" style={{ marginBottom: '1rem' }}>
          <Button 
            basic={viewMode !== 'table'} 
            color="blue" 
            onClick={() => setViewMode('table')}
          >
            <Icon name="table" />
            Table View
          </Button>
          <Button 
            basic={viewMode !== 'cards'} 
            color="blue" 
            onClick={() => setViewMode('cards')}
          >
            <Icon name="grid layout" />
            Card View
          </Button>
        </Button.Group>

        {users && viewMode === 'table' && (
          <div className="table-container">
            <div
              className="ag-theme-balham"
              style={{
                height: "500px",
                width: "100%",
              }}
            >
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={users}
                rowHeight={50}
                animateRows={true}
                domLayout="autoHeight"
                suppressCellFocus={true}
              ></AgGridReact>
            </div>
          </div>
        )}

        {users && viewMode === 'cards' && renderUserCards()}

        <Divider hidden />
        {tenantId ? (
          <LinkContainer to={`/tenants/${tenantId}/user`}>
            <Button basic color="blue" >Create new tenant employee</Button>
          </LinkContainer>
        ) : (
          <LinkContainer to={`/user`}>
            <Button size="tiny" basic color="blue">
              <Icon name="plus" />
              Employee
            </Button>
          </LinkContainer>
        )}
      </>
    );
  }


  if (isLoading) return <Loader active/>;

  return renderUsers();
}
