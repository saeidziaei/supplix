import { Auth } from "aws-amplify";
import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Grid,
  Icon,
  Image, Label, List,
  Loader, Menu, PlaceholderImage, Popup, Segment,
  Sidebar
} from "semantic-ui-react";
import "./App.css";
import Routes from "./Routes";
import { NCR } from "./components/NCR";
import User from "./components/User";
import placeholderImage from "./fileplaceholder.jpg";
import { makeApiCall } from "./lib/apiLib";
import { s3Get } from "./lib/awsLib";
import AppContext from "./lib/contextLib";
import { onError } from "./lib/errorLib";
import { normaliseCognitoUser, normaliseCognitoUsers } from "./lib/helpers";
import MasterLayout from "./components/MasterLayout";


export default App;

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState([]);
  const [sidebarWorkspaces, setSidebarWorkspaces] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedWorkspaces');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading expandedWorkspaces from localStorage:', e);
      return {};
    }
  });
  

  const nav = useNavigate();

  
  async function handleLogout() {
    await Auth.signOut();

    setAuthenticatedUser(null);
    nav("/login");
  }
  useEffect(() => {

    async function onLoad() {
      try {
        const session = await Auth.currentSession();

        setAuthenticatedUser(session.idToken.payload);

      } catch (e) {
        console.log(e);
        if (e != "No current user") {
          console.log(e);
          alert(e);
        }
        await Auth.signOut();
        // nav("/login");
      }

      setIsAuthenticating(false);
    }

    onLoad();
  }, []);

  useEffect(() => {
    async function loadMyTenant() {
      if (!authenticatedUser)
        return;
        
      const tenant = await makeApiCall("GET", `/mytenant`);
      
      if (tenant && tenant.logo) {
        tenant.logoURL = await s3Get(tenant.logo);
      }
      return tenant;
    }
    async function loadWorkspaces() {
      return await makeApiCall("GET", `/workspaces`);
    }
    async function loadUsers() {
      return await makeApiCall("GET", `/users`);
    }
    async function loadMyTasks() {
      return await makeApiCall("GET", `/mytasks`);
    }
    async function loadMyEmployee() {
      if (!authenticatedUser)
        return;
      
      const item = await makeApiCall("GET", `/myuser`);

      return normaliseCognitoUser(item);
    }

    const buildSidebarWorkspaces = (workspaces) => {
      const buildChildren = (parentId) => {
        return workspaces
          .filter(ws => ws.parentId === parentId)
          .map(ws => ({
            ...ws,
            children: buildChildren(ws.workspaceId)
          }));
      };

      const topLevel = workspaces.filter(ws => ws.showInMenu && ws.parentId === null);
      return topLevel.map(parent => ({
        ...parent,
        children: buildChildren(parent.workspaceId)
      }));
    }

    async function onLoad() {
      try {
        const [tenant, employee, tasks, userItems, workspaces] = await Promise.all([loadMyTenant(), loadMyEmployee(), loadMyTasks(), loadUsers(), loadWorkspaces()]);

        setTenant(tenant);
        setEmployee(employee);
        setTasks(tasks);
        setUsers(normaliseCognitoUsers(userItems));
        setSidebarWorkspaces(buildSidebarWorkspaces(workspaces));
      } catch (e) {
        onError(e);
      }
    }
    
    if (authenticatedUser) {
      onLoad();
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (authenticatedUser) {
      setCurrentUserRoles(authenticatedUser["cognito:groups"] || []);
    } else {
      setCurrentUserRoles([]);
    }
  }, [authenticatedUser]);

  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);

  // Add effect to save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('expandedWorkspaces', JSON.stringify(expandedWorkspaces));
  }, [expandedWorkspaces]);

  function renderApp() {
    const isAdmin = currentUserRoles.includes('admins');
    const isTopLevelAdmin = currentUserRoles.includes('top-level-admins');

    const logoURL =
      tenant && tenant.logoURL ? tenant.logoURL : "/iso_cloud_logo_v1.png";

    const tasksCount = tasks ? tasks.length : 0;
    const isMobile = window.innerWidth <= 768;

    return (
      !isAuthenticating && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Grid style={{ margin: 0, flexShrink: 0 }}>
            <Grid.Row verticalAlign="middle">
              <Grid.Column width="10">
                <List divided horizontal>
                  <List.Item>
                    {tenant ? (
                      <Image
                        onClick={() => nav("/")}
                        size="small"
                        rounded
                        alt="logo"
                        src={logoURL}
                        style={{ cursor: "pointer" }}
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <PlaceholderImage />
                    )}
                  </List.Item>
                  <List.Item>
                    <Icon name="bars" onClick={() => setIsSidebarVisible(!isSidebarVisible)} style={{cursor: "pointer"}} />
                    
                    
                  </List.Item>
                  </List>
                  </Grid.Column>
                  <Grid.Column width="5"  textAlign="right"><List horizontal>
                  {employee && (
                    <List.Item>
        <Popup pinned on="click"
          trigger={<span style={{cursor: "pointer"}}><User user={employee} compact={isMobile} /></span>}
          content={<Button size="tiny" basic content='Logout' icon='log out' onClick={handleLogout}/>}
          position='bottom right'
        />



                    </List.Item>
                  )}
               
                </List>
              </Grid.Column>
            </Grid.Row>
          </Grid>

          {/* Main content area */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Sidebar.Pushable as={Segment} style={{ margin: 0, border: 'none', borderRadius: 0 }}>
              <Sidebar
                as={Menu}
                visible={isSidebarVisible}
                vertical
                animation="slide along"
                size="medium"
              >
                {authenticatedUser ? (
                  <>
                  <LinkContainer
                  to="/"
                  
                >
                  <Nav.Link as={Menu.Item}>
                    <span>
                      <Icon name="home" />
                      Workspaces
                    </span>
                  </Nav.Link>
                </LinkContainer>
                    <LinkContainer
                      to="/mytasks"
                      
                    >
                      <Menu.Item as="a" >
                        <Label color={tasksCount ? "teal" : "black"}>
                          {tasksCount}
                        </Label>
                        <span style={{color: "white"}}>Tasks</span>
                      </Menu.Item>
                    </LinkContainer>

                    
{ sidebarWorkspaces && sidebarWorkspaces.map(ws => (
  <Menu.Item 
    key={ws.workspaceId} 
    style={{ color: '#2185d0' }}
    onClick={(e) => {
      if (ws.children && ws.children.length > 0 ) {
        e.preventDefault();
        setExpandedWorkspaces(prev => ({
          ...prev,
          [ws.workspaceId]: !prev[ws.workspaceId]
        }));
      }
    }}
  >
    {ws.children && ws.children.length > 0 && (
      <Icon 
        name={expandedWorkspaces[ws.workspaceId] ? 'chevron down' : 'chevron right'} 
        style={{ marginRight: '5px' }}
      />
    )}
    {!ws.isPlaceholder ? (
      
      <LinkContainer to={`workspace/${ws.workspaceId}/registers`}>
        <Nav.Link  style={{ color: 'white' }}>
          <Icon name="folder" />
          {ws.workspaceName}
        </Nav.Link>
      </LinkContainer>
    ) : (
      <span>
        {ws.workspaceName}
      </span>
    )}
    {ws.children && ws.children.length > 0 && expandedWorkspaces[ws.workspaceId] && (
      <Menu.Menu style={{ marginTop: '5px' }}>
        {ws.children.map(child => (
          child.workspaceId && (
            <Menu.Item 
              key={child.workspaceId} 
              style={{ 
                backgroundColor: '#f9f9f9', 
                color: "white",
                padding: '10px 20px',
                marginBottom: '2px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkContainer to={`workspace/${child.workspaceId}/registers`} >
                <Nav.Link 
                  onClick={(e) => {
                    e.stopPropagation();
                    
                  }} 
                >
                  <Icon name="chevron right" />
                  {child.workspaceName}
                </Nav.Link>
              </LinkContainer>
            </Menu.Item>
          )
        ))}
      </Menu.Menu>
    )}
  </Menu.Item>
))} 
                   

                    {(isAdmin || isTopLevelAdmin) && (
                      <LinkContainer
                        to="/templates"
                        
                      >
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="clipboard list" />
                            Form Builder
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                    )}

                    {isTopLevelAdmin && (
                      <LinkContainer
                        to="/tenants"
                        
                      >
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="building" color="red" />
                            Tenants
                          </span>
                          <Icon name="hand paper" color="red" />
                        </Nav.Link>
                      </LinkContainer>
                    )}
                    {(isAdmin || isTopLevelAdmin) && (
                      <LinkContainer
                        to="/users"
                        
                      >
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="users" />
                            Employees
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                    )}
                    {authenticatedUser && (
                  <Menu.Item>
                    <NCR label={tenant?.NCRLabel} />
                  </Menu.Item>
                )}
                  </>
                ) : (
                  <>
                    <Menu.Item>
                      <LinkContainer to="/login">
                        <Nav.Link>
                          <Icon name="sign-in" />
                          Login
                        </Nav.Link>
                      </LinkContainer>
                    </Menu.Item>
                  </>
                )}

                <Menu.Item>
                  <img alt="logo" src="/iso_cloud_logo_v1.png" />
                </Menu.Item>

                <Menu.Item >
                  <p style={{ fontSize: "0.8em", color:"white" }}>
                    <br />
                    <br />
                    <br />
                    {tenant ? tenant.tenantName : ""}
                    <br />
                    <br />
                    {employee ? employee.given_name : ""}
                  </p>
                </Menu.Item>
                
              </Sidebar>

              <Sidebar.Pusher>
                <div className="main-content">
                  <MasterLayout>
                    <AppContext.Provider
                      value={{
                        authenticatedUser,
                        setAuthenticatedUser,
                        currentUserRoles,
                        setCurrentUserRoles,
                        users,
                        setUsers,
                        tenant,
                        setTenant,
                      }}
                    >
                      <Routes
                        tenant={tenant}
                        currentUserRoles={currentUserRoles}
                      />
                      
                    </AppContext.Provider>
                  </MasterLayout>
                </div>
              </Sidebar.Pusher>
            </Sidebar.Pushable>
          </div>
        </div>
      )
    );
  }

  if (isAuthenticating) return <Loader active />;

  return renderApp();
}
