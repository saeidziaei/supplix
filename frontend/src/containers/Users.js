import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import React, { useEffect, useRef, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Link, useParams } from "react-router-dom";
import { Button, Divider, Grid, Icon, Image, List, Loader, Message, Segment } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import placeholderImage from '../fileplaceholder.jpg';
import { makeApiCall } from "../lib/apiLib";
import { s3Get } from "../lib/awsLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter, normaliseCognitoUsers } from "../lib/helpers";
import "./Users.css";

export default function Users() {
  const gridRef = useRef();
  const { tenantId } = useParams(null);
  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  class NameRenderer {
    init(params) {
      const user = params.data;      
      this.eGui = document.createElement('div');
      this.eGui.classList.add('custom-element');
      this.eGui.innerHTML = `
          <a href="${
            tenantId
              ? `/tenants/${tenantId}/user/${user.Username}`
              : `/user/${user.Username}`
          }" target="_blank">${capitalizeFirstLetter(user.given_name)} ${capitalizeFirstLetter(user.family_name)}</a>
      `;
    }
  
    getGui() {
      return this.eGui;
    }
  
    refresh(params) {
      return false;
    }
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
  class PhotoRenderer {
    init(params) {
      this.eGui = document.createElement('div');
      this.eGui.classList.add('portrait');
      this.eGui.innerHTML = `<img src="${params.data.photoURL ?? '/placeholderUserImage.png'}">`;
    }
  
    getGui() {
      return this.eGui;
    }
  
    refresh(params) {
      return false;
    }
  }

  const columnDefs = [
    { field: 'Photo', headerName: 'Photo', width: '80', cellRenderer: PhotoRenderer},
    { field: 'Name', headerName: 'Name', resizable: true, sortable: true, cellRenderer: NameRenderer, valueGetter: (params) => {return params.data.given_name + " " + params.data.family_name}  },
    { field: 'employeeNumber', resizable: true, sortable: true },
    { field: 'email', headerName: 'Email', resizable: true, sortable: true, cellRenderer: EmailRenderer  },
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
  }, []);

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
        {users && (
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
              rowHeight="30"
              animateRows={true}
            ></AgGridReact>
          </div>
        )}
        <Divider hidden />
        {tenantId ? (
          <LinkContainer to={`/tenants/${tenantId}/user`}>
            <Button basic color="blue" >Create new tenant employee</Button>
          </LinkContainer>
        ) : (
          <LinkContainer to={`/user`}>
            <Button size="tiny" basic color="blue">
              <Icon name="plus" />
              New Employee
            </Button>
          </LinkContainer>
        )}
      </>
    );
    
  }


  if (isLoading) return <Loader active/>;

  return renderUsers();
}
