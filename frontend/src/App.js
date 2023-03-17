import React, { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import "./App.css";
import Routes from "./Routes";
import { LinkContainer } from "react-router-bootstrap";
import { AppContext } from "./lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import {
  Button,
  Grid,
  Icon,
  Image,
  Menu,
  Segment,
  Sidebar,
  Label,
  List,
  Loader,
  PlaceholderImage,
  Divider,
} from "semantic-ui-react";
import { s3Get } from "./lib/awsLib";
import { makeApiCall } from "./lib/apiLib";
import placeholderImage from "./containers/fileplaceholder.jpg";

export default App;

function App() {
  const IS_NOTE_MODE = true;
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRoles, setCurrentUserRoles] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [templates, setTemplates] = useState(null);

  const nav = useNavigate();

  async function handleLogout() {
    await Auth.signOut();

    userHasAuthenticated(false);
    nav("/login");
  }
  useEffect(() => {

    async function onLoad() {
      try {
        console.log("app load");
        const session = await Auth.currentSession();

        const decodedJwt = jwt_decode(session.getAccessToken().getJwtToken());
        setCurrentUserRoles(decodedJwt["cognito:groups"] || [])

        setCurrentUser(jwt_decode(session.getIdToken().getJwtToken()).email);

        userHasAuthenticated(true);
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
      if (!isAuthenticated)
        return;
        
      const tenant = await makeApiCall("GET", `/mytenant`);
      
      if (tenant && tenant.logo) {
        tenant.logoURL = await s3Get(tenant.logo);
      }
      return tenant;
    }

    async function loadTemplates() {
      let ret;
      if (IS_NOTE_MODE)
        ret = await makeApiCall("GET", `/ntemplates`);
      else
        ret = await makeApiCall("GET", `/templates`);

      return ret;
    }
    async function onLoad() {
      try {
        const [templates, tenant] = await Promise.all([loadTemplates(), loadMyTenant()]);

        setTenant(tenant);
        setTemplates(templates)
      } catch (e) {
        alert(e);
      }
    }
    

    onLoad();
  }, [isAuthenticated]);

  // return (
  //   !isAuthenticating && (
  //   <div className="App container py-3">

  //     <Navbar collapseOnSelect bg="light" expand="md" className="mb-3 hide-on-print">
  //       <LinkContainer to="/">
  //         <Navbar.Brand className="font-weight-bold text-muted">
  //           ISO Cloud {isTopLevelAdmin ? <div>Hi Top Gun!</div> : <div>Hey Consultant</div>}
  //         </Navbar.Brand>

  //       </LinkContainer>
  //       <Navbar.Toggle />
  //       <Navbar.Collapse className="justify-content-end">
  //         <Nav activeKey={window.location.pathname}>
  //           {isAuthenticated ? (
  //             <>
  //               <LinkContainer to="/dynamic-form"><Nav.Link>Generic Form</Nav.Link></LinkContainer>
  //               <LinkContainer to="/users"><Nav.Link>Users</Nav.Link></LinkContainer>
  //               <LinkContainer to="/project-context"><Nav.Link>Project</Nav.Link></LinkContainer>
  //               <LinkContainer to="/customers"><Nav.Link>Customers</Nav.Link></LinkContainer>
  //               <LinkContainer to="/forms"><Nav.Link>Forms</Nav.Link></LinkContainer>
  //               <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
  //             </>
  //           ) : (
  //             <>
  //               <LinkContainer to="/signup"><Nav.Link>Signup</Nav.Link></LinkContainer>
  //               <LinkContainer to="/login"><Nav.Link>Login</Nav.Link></LinkContainer>

  //             </>
  //           )}
  //         </Nav>
  //       </Navbar.Collapse>
  //     </Navbar>
  //     <AppContext.Provider value={{
  //       isAuthenticated,
  //       userHasAuthenticated,
  //       isTopLevelAdmin,
  //       jwtToken,
  //       currentCustomer,
  //       setCurrentCustomer,
  //       currentIso,
  //       setCurrentIso,

  //       }}><div>Sidebar</div>
  //       <Routes />
  //     </AppContext.Provider>
  //   </div>
  //   )
  // );

  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false);

  function renderNotesApp() {
    return (
      !isAuthenticating && (
        <>
          <List divided horizontal>
            <List.Item>
              <Image
                size="medium"
                rounded
                alt="logo"
                src="/notes/DentalNotes.png"
              />
            </List.Item>
            <List.Item>
              <Button
                color="black"
                icon="bars"
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              ></Button>
            </List.Item>
          </List>

          <Grid columns={1}>
            <Grid.Column>
              <Sidebar.Pushable as={Segment}>
                <Sidebar
                  as={Menu}
                  visible={isSidebarVisible}
                  vertical
                  onHide={() => setIsSidebarVisible(false)}
                  onClick={() => setIsSidebarVisible(false)}
                  animation="push"
                >
                  <LinkContainer to="/">
                    <Nav.Link as={Menu.Item}>
                      <span>
                        <Icon name="home" />
                        Home
                      </span>
                    </Nav.Link>
                  </LinkContainer>

                  {isAuthenticated ? (
                    <>
                      <LinkContainer to="/ntemplates">
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon color="blue" name="clipboard list" />
                            All Note Templates
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                      {templates && templates.map((t) => (
                        <LinkContainer key={t.templateId} to={`/nform/${t.templateId}`}>
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="angle double right" />
                            {`New ${t.templateDefinition.title}`}
                          </span>
                        </Nav.Link>
                      </LinkContainer>)
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
                        <LinkContainer to="/signup">
                          <Nav.Link>
                            <Icon name="signup" />
                            Signup
                          </Nav.Link>
                        </LinkContainer>
                      </Menu.Item>
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
                    <img alt="logo" src="/notes/DentalNotes.png" />
                  </Menu.Item>
                </Sidebar>

                <Sidebar.Pusher>
                  <Segment basic style={{ minHeight: "100vh" }}>
                    <AppContext.Provider
                      value={{
                        isAuthenticated,
                        userHasAuthenticated,
                        currentUserRoles
                      }}
                    >
                      <Routes />
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
  function renderApp() {
    const isAdmin = currentUserRoles.includes('admins');
    const isTopLevelAdmin = currentUserRoles.includes('top-level-admins');

    const logoURL =
      tenant && tenant.logoURL ? tenant.logoURL : "/iso_cloud.png";
    
    return (
      !isAuthenticating && (
        <>
          <List divided horizontal>
            <List.Item>
              {tenant ? (
                <Image
                  size="medium"
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
                color="black"
                icon="bars"
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              ></Button>
            </List.Item>
          </List>

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
                >
                  <LinkContainer to="/">
                    <Nav.Link as={Menu.Item}>
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

                  {isAuthenticated ? (
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
                      {(isAdmin || isTopLevelAdmin) &&
                      <LinkContainer to="/templates">
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="clipboard list" />
                            Templates
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                    }
                    
                      <LinkContainer to="/registers">
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="folder open outline" />
                            Register
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                      <LinkContainer to="/docs">
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="book" />
                            Library
                          </span>
                        </Nav.Link>
                      </LinkContainer>
                      {(isTopLevelAdmin) &&
                      <LinkContainer to="/tenants" >
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="building" color="red"/>
                            Tenants
                          </span>
                          <Icon name="hand paper" color="red"/>
                        </Nav.Link>
                      </LinkContainer>
                    }
                      {(isAdmin || isTopLevelAdmin) &&
                      <LinkContainer to="/users" >
                        <Nav.Link as={Menu.Item}>
                          <span>
                            <Icon name="users" color="red"/>
                            Users
                          </span>
                          
                        </Nav.Link>
                      </LinkContainer>
                    }
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
                    <img alt="logo" src="/iso_cloud.png" />
                  </Menu.Item>

                  <Menu.Item color="blue">
                    <p style={{ fontSize: "0.8em" }}>
                      <br />
                      <br />
                      <br />
                      {tenant ? tenant.tenantName : ""}
                      <br />
                      <br />
                      {currentUser}
                    </p>
                  </Menu.Item>
                </Sidebar>

                <Sidebar.Pusher>
                  <Segment basic style={{ minHeight: "100vh" }}>
                    <AppContext.Provider
                      value={{
                        isAuthenticated,
                        userHasAuthenticated,
                        currentUserRoles
                      }}
                    >
                      <Routes tenant={tenant} currentUserRoles={currentUserRoles} />
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

  const tenantName = window.location.pathname.split("/")[1];
  // Check tenant is valid
  // if (tenantName  != "t1" && tenantName != "t2") return <h1>Wrong way, go back!</h1>;

  if (isAuthenticating) return <Loader active />;

  return IS_NOTE_MODE ? renderNotesApp() : renderApp();
}
