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
import { AppContext } from "./lib/contextLib";
import { onError } from "./lib/errorLib";
import { normaliseCognitoUser, normaliseCognitoUsers } from "./lib/helpers";
import MasterLayout from "./components/MasterLayout";


export default App;

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  
  const [tenant, setTenant] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState([]);


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


    async function onLoad() {
      try {
        const [tenant, employee, tasks, userItems] = await Promise.all([loadMyTenant(), loadMyEmployee(), loadMyTasks(), loadUsers()]);

        setTenant(tenant);
        setEmployee(employee);
        setTasks(tasks);
        setUsers(normaliseCognitoUsers(userItems))
      } catch (e) {
        onError(e);
      }
    }
    
    if (authenticatedUser) {
      onLoad();
    }
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
          <Grid  style={{ marginBottom: "-3rem" }}>
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
          <Grid columns={1}>
            <Grid.Column>
              <Sidebar.Pushable as={Segment}>
                <Sidebar
                  as={Menu}
                  visible={isSidebarVisible}
                  
                  vertical
                  onHide={() => setIsSidebarVisible(false)}
                  animation="overlay"
                  size="small"
                >
                  

                  {authenticatedUser ? (
                    <>
                    <LinkContainer
                    to="/"
                    onClick={() => setIsSidebarVisible(false)}
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
                        onClick={() => setIsSidebarVisible(false)}
                      >
                        <Menu.Item as="a">
                          <Label color={tasksCount ? "teal" : "black"}>
                            {tasksCount}
                          </Label>
                          Tasks
                        </Menu.Item>
                      </LinkContainer>

                      {/*
                  <Menu.Item as="a">
                    <Label color="orange">3</Label>
                    Notifications
                  </Menu.Item> */}

                     

                      {(isAdmin || isTopLevelAdmin) && (
                        <LinkContainer
                          to="/templates"
                          onClick={() => setIsSidebarVisible(false)}
                        >
                          <Nav.Link as={Menu.Item}>
                            <span>
                              <Icon name="clipboard list" />
                              Forms
                            </span>
                          </Nav.Link>
                        </LinkContainer>
                      )}

                      {isTopLevelAdmin && (
                        <LinkContainer
                          to="/tenants"
                          onClick={() => setIsSidebarVisible(false)}
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
                          onClick={() => setIsSidebarVisible(false)}
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

                <Sidebar.Pusher dimmed={isSidebarVisible}>
                  <Segment basic style={{ minHeight: "100vh" }}>
                    <MasterLayout>
                    <AppContext.Provider
                      value={{
                        authenticatedUser,
                        setAuthenticatedUser,
                        currentUserRoles,
                        tenant,
                        users,
                      }}
                    >
                      <Routes
                        tenant={tenant}
                        currentUserRoles={currentUserRoles}
                      />
                      
                    </AppContext.Provider>
                    </MasterLayout>
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
