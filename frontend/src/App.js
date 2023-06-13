import { Auth } from "aws-amplify";
import jwt_decode from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dropdown,
  Grid,
  Icon,
  Image, List,
  Loader, Menu, PlaceholderImage, Segment,
  Sidebar
} from "semantic-ui-react";
import "./App.css";
import Routes from "./Routes";
import config from "./config";
import placeholderImage from "./fileplaceholder.jpg";
import { makeApiCall } from "./lib/apiLib";
import { s3Get } from "./lib/awsLib";
import { AppContext } from "./lib/contextLib";
import User from "./components/User";


export default App;

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const [tenant, setTenant] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState(null);
  const [employee, setEmployee] = useState(null);

  const nav = useNavigate();

  
  async function handleLogout() {
    await Auth.signOut();

    setAuthenticatedUser(null);
    nav("/login");
  }
  useEffect(() => {

    async function onLoad() {
      try {
        console.log("app load");
        const session = await Auth.currentSession();

        setAuthenticatedUser(session.idToken.payload);

      } catch (e) {
       
        if (e !== "No current user") {
          alert(e);
        }
        await Auth.signOut();
        nav("/login");
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

    async function loadMyEmployee() {
      function getAttribute(user, attributeName) {
        const attribute = user.UserAttributes.find(
          (attr) => attr.Name === attributeName
        );
        if (attribute) {
          return attribute.Value;
        } else {
          return undefined;
        }
      }

      if (!authenticatedUser)
        return;
      
      const item = await makeApiCall("GET", `/users/${authenticatedUser.sub}`);

      return {
        given_name: getAttribute(item, "given_name") || "",
        family_name: getAttribute(item, "family_name") || "",
        phone: getAttribute(item, "phone_number") || "",
        email: getAttribute(item, "email") || "",
        ...item
      }
    }


    async function loadMyWorkspaces() {
      if (!authenticatedUser)
        return;
        
      return await makeApiCall("GET", `/myworkspaces`);
    }

    async function onLoad() {
      try {
        const [workspaces, tenant, employee] = await Promise.all([loadMyWorkspaces(), loadMyTenant(), loadMyEmployee()]);

        setTenant(tenant);
        setWorkspaces(workspaces);
        setEmployee(employee);
      } catch (e) {
        alert(e);
      }
    }
    

    onLoad();
  }, [authenticatedUser]);

  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);

  async function loadAppWorkspace(workspaceId) {
    if (currentWorkspace && currentWorkspace.workspaceId === workspaceId) {
      // no need to re-load
      return currentWorkspace;
    }

    const ws = await makeApiCall("GET", `/workspaces/${workspaceId}`);
    setCurrentWorkspace(ws);
    return ws;
  }

  function renderApp() {
    console.log("API Gateway URL", config.apiGateway.URL);
    const currentUserRoles = authenticatedUser ? authenticatedUser["cognito:groups"] || [] : [];
    const isAdmin = currentUserRoles.includes('admins');
    const isTopLevelAdmin = currentUserRoles.includes('top-level-admins');

    const logoURL =
      tenant && tenant.logoURL ? tenant.logoURL : "/iso_cloud_logo_v1.png";
    
    return (
      !isAuthenticating && (
        <>
          <Grid doubling stackable style={{ marginBottom: "-3rem" }}>
            <Grid.Row verticalAlign="middle">
              <Grid.Column width="7">
                <List divided horizontal>
                  <List.Item>
                    {tenant ? (
                      <Image
                        size="small"
                        rounded
                        alt="logo"
                        src={logoURL}
                        onError={(e) => {
                          e.target.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <PlaceholderImage />
                    )}
                  </List.Item>
                  <List.Item>
                    <Button
                    size="mini"
                      color="black"
                      icon="bars"
                      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    ></Button>
                    <Button
                    size="mini"
                      color="grey"
                      icon="refresh"
                      onClick={() => {window.location.reload();}}
                    ></Button>
{employee && <User user={employee}  /> }
                  </List.Item>
                </List>
              </Grid.Column>
              <Grid.Column width={5}>
                <Menu vertical>
                  <Dropdown
                    item
                    fluid
                    text={
                      currentWorkspace
                        ? currentWorkspace.workspaceName
                        : "(Workspace)"
                    }
                  >
                    {workspaces && (
                      <Dropdown.Menu>
                        {workspaces.map((w, index) => (
                          <Dropdown.Item
                            key={index}
                            onClick={() => {
                              setCurrentWorkspace(w);
                              nav(`/workspace/${w.workspaceId}/registers`);
                              window.location.reload();
                            }}
                          ><Icon name={w.role === "Owner" ? "chess king" : "user"} />
                            {w.workspaceName}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    )}
                  </Dropdown>
                </Menu>
              </Grid.Column>
   
            </Grid.Row>
          </Grid>
          <Grid columns={1}>
            <Grid.Column>
              <Sidebar.Pushable as={Segment}>
                <Sidebar
                  as={Menu}
                  visible={isSidebarVisible}
                  inverted
                  vertical
                  onHide={() => setIsSidebarVisible(false)}
                  animation="push"
                  size="small"
                >
                  <LinkContainer to="/">
                    <Nav.Link as={Menu.Item} >
                      <span>
                        <Icon name="home" />
                        Home
                      </span>
                    </Nav.Link>
                  </LinkContainer>

                  {/* <Menu.Item as="a">
                    <Label color="teal">5</Label>
                    Tasks
                  </Menu.Item>
                  <Menu.Item as="a">
                    <Label color="orange">3</Label>
                    Notifications
                  </Menu.Item> */}

                  {authenticatedUser ? (
                    <>
                      <Menu.Item>
                        <Menu.Header color="white">ISOs</Menu.Header>
                        <Menu.Menu>
                          <LinkContainer to="/iso">
                            <Nav.Link as={Menu.Item}>
                              <span>
                                <Icon name="sitemap" />
                                9001
                              </span>
                            </Nav.Link>
                          </LinkContainer>
                          {/* <LinkContainer to="/iso">
                            <Nav.Link as={Menu.Item}>
                              <span>
                                <Icon name="sitemap" />
                                27001
                              </span>
                            </Nav.Link>
                          </LinkContainer> */}
                        </Menu.Menu>
                      </Menu.Item>
                      {(isAdmin || isTopLevelAdmin) && (
                        <>
                        <LinkContainer to="/templates">
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="clipboard list" />
                              Forms
                            </span>
                          </Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/workspaces">
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="laptop" />
                              Workspaces
                            </span>
                          </Nav.Link>
                        </LinkContainer>
                        </>
                      )}
                      {currentWorkspace && (
                        <>
                          <LinkContainer to={`/workspace/${currentWorkspace.workspaceId}/registers`}>
                            <Nav.Link as={Menu.Item}>
                              <span>
                                <Icon name="folder open outline" />
                                Register
                              </span>
                            </Nav.Link>
                          </LinkContainer>

                          <LinkContainer
                            to={`/workspace/${currentWorkspace.workspaceId}/docs`}
                          >
                            <Nav.Link as={Menu.Item}>
                              <span>
                                <Icon name="book" />
                                Library
                              </span>
                            </Nav.Link>
                          </LinkContainer>
                        </>
                      )}
                      {isTopLevelAdmin && (
                        <LinkContainer to="/tenants">
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
                        <LinkContainer to="/users">
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="users"  />
                              Employees
                            </span>
                          </Nav.Link>
                        </LinkContainer>
                      )}
                      <LinkContainer to="/logout">
                        <Nav.Link as={Menu.Item} onClick={handleLogout}>
                          <span>
                            <Icon name="log out" />
                            Logout
                          </span>
                        </Nav.Link>
                      </LinkContainer>
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

                  <Menu.Item color="blue">
                    <p style={{ fontSize: "0.8em" }}>
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
                  <Segment basic style={{ minHeight: "100vh" }}>
                    <AppContext.Provider
                      value={{
                        authenticatedUser,
                        setAuthenticatedUser,
                        currentUserRoles,
                        currentWorkspace,
                        loadAppWorkspace,
                      }}
                    >
                      <Routes
                        tenant={tenant}
                        currentUserRoles={currentUserRoles}
                      />
                      {/* <Routes /> */}
                    </AppContext.Provider>
                  </Segment>
                </Sidebar.Pusher>
              </Sidebar.Pushable>
            </Grid.Column>
          </Grid>
        </>
      )
    );
  }

  if (isAuthenticating) return <Loader active />;

  return renderApp();
}
