import { Auth } from "aws-amplify";
import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dropdown,
  Grid,
  Icon,
  Image, Label, List,
  Loader, Menu, PlaceholderImage, Segment,
  Sidebar
} from "semantic-ui-react";
import "./App.css";
import Routes from "./Routes";
import User from "./components/User";
import placeholderImage from "./fileplaceholder.jpg";
import { makeApiCall } from "./lib/apiLib";
import { s3Get } from "./lib/awsLib";
import { AppContext } from "./lib/contextLib";
import { normaliseCognitoUser } from "./lib/helpers";
import { NCR } from "./components/NCR";


export default App;

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const [tenant, setTenant] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState(null);


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

    async function loadMyTasks() {
      return await makeApiCall("GET", `/mytasks`);
    }
    async function loadMyEmployee() {
      if (!authenticatedUser)
        return;
      
      const item = await makeApiCall("GET", `/myuser`);

      return normaliseCognitoUser(item);
    }


    async function onLoad() {
      try {
        const [tenant, employee, tasks] = await Promise.all([loadMyTenant(), loadMyEmployee(), loadMyTasks()]);

        setTenant(tenant);
        setEmployee(employee);
        setTasks(tasks);
      } catch (e) {
        alert(e);
      }
    }
    

    onLoad();
  }, [authenticatedUser]);


  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);


  function renderApp() {
    
    const currentUserRoles = authenticatedUser ? authenticatedUser["cognito:groups"] || [] : [];
    const isAdmin = currentUserRoles.includes('admins');
    const isTopLevelAdmin = currentUserRoles.includes('top-level-admins');

    const logoURL =
      tenant && tenant.logoURL ? tenant.logoURL : "/iso_cloud_logo_v1.png";

    const tasksCount = tasks ? tasks.length : 0;
    const isMobile = window.innerWidth <= 768;

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
                        onClick={() => nav("/")}
                        size={isMobile ? "tiny" : "small"}
                        rounded
                        alt="logo"
                        src={logoURL}
                        style={{cursor: "pointer"}}
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
                      style={{float:"left"}}
                    ></Button>
                    <Button
                      size="mini"
                      color="grey"
                      icon="refresh"
                      onClick={() => {
                        window.location.reload();
                      }}
                      style={{float:"left"}}
                    ></Button>
                    {employee && <User user={employee} compact={isMobile} />}
                  </List.Item>
                  <List.Item ><NCR /> </List.Item>
                </List>
                

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
                  <LinkContainer to="/" onClick={() => setIsSidebarVisible(false)}>
                    <Nav.Link as={Menu.Item}>
                      <span>
                        <Icon name="home" />
                        Home
                      </span>
                    </Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/mytasks" onClick={() => setIsSidebarVisible(false)}>
                   <Menu.Item as="a">
                    <Label color={tasksCount ? "teal" : "black"}>{tasksCount}</Label>
                    Tasks
                  </Menu.Item>
                  </LinkContainer>
                  
                  {/*
                  <Menu.Item as="a">
                    <Label color="orange">3</Label>
                    Notifications
                  </Menu.Item> */}

                  {authenticatedUser ? (
                    <>
                          <LinkContainer to="/iso" onClick={() => setIsSidebarVisible(false)}>
                            <Nav.Link as={Menu.Item}>
                              <span>
                                <Icon name="sitemap" />
                                ISO
                              </span>
                            </Nav.Link>
                          </LinkContainer>
                       
                      {(isAdmin || isTopLevelAdmin) && (
                        <LinkContainer to="/templates" onClick={() => setIsSidebarVisible(false)}>
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="clipboard list" />
                              Forms
                            </span>
                          </Nav.Link>
                        </LinkContainer>
                      )}
      
               
                      {isTopLevelAdmin && (
                        <LinkContainer to="/tenants" onClick={() => setIsSidebarVisible(false)}>
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
                        <LinkContainer to="/users" onClick={() => setIsSidebarVisible(false)}>
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="users" />
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
