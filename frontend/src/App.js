import React, { useState, useEffect } from "react";
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import "./App.css";
import Routes from "./Routes";
import { LinkContainer } from "react-router-bootstrap";
import { AppContext } from "./lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import {
  Button,
  Checkbox,
  Grid,
  Header,
  Icon,
  Image,
  Menu,
  Segment,
  Sidebar,
  Container,
  Label,
  List,
  
} from 'semantic-ui-react'

export default App;


function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isTopLevelAdmin, setIsTopLevelAdmin] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentIso, setCurrentIso] = useState(null);


  const nav = useNavigate();

  async function handleLogout() {
    await Auth.signOut();

    userHasAuthenticated(false);
    nav("/login");
  }
  useEffect(() => {
    onLoad();
  }, []); // If we pass in an empty list of variables, then it’ll only run our function on the FIRST render



  async function onLoad() {
    try {
      console.log("app load");
      const session = await Auth.currentSession();

      //const att = await Auth.userAttributes();
      //console.log("userAttributes", att);

      const decodedJwt = jwt_decode(session.getAccessToken().getJwtToken());
      setIsTopLevelAdmin(decodedJwt["cognito:groups"] && decodedJwt["cognito:groups"].includes("top-level-admins"));

      userHasAuthenticated(true);
    } catch (e) {
      if (e !== "No current user") {
        alert(e);
      }
      nav("/login");
    }
    setIsAuthenticating(false);
    
  }


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

  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false)

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
                  animation="push"
                >
                  <Menu.Item>
                    <LinkContainer to="/">
                      <Nav.Link>
                        <Icon name="home" />
                        Home
                      </Nav.Link>
                    </LinkContainer>
                  </Menu.Item>

                  {isAuthenticated ? (
                    <>

                      <Menu.Item>
                        <LinkContainer to="/ntemplates">
                          <Nav.Link>
                            <Icon color="blue" name="clipboard list" />
                            Note Templates
                          </Nav.Link>
                        </LinkContainer>
                      </Menu.Item>
                      <Menu.Item>
                        <LinkContainer to="/nregisters">
                          <Nav.Link>
                            <Icon name="folder open outline" />
                            Note Register
                          </Nav.Link>
                        </LinkContainer>
                      </Menu.Item>

                      <Menu.Item>
                        <Nav.Link onClick={handleLogout}>
                          <Icon name="log out" />
                          Logout
                        </Nav.Link>
                      </Menu.Item>
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
                        isTopLevelAdmin,
                        currentCustomer,
                        setCurrentCustomer,
                        currentIso,
                        setCurrentIso,
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
    return (
      !isAuthenticating && (
        <>
          <List divided horizontal>
            <List.Item>
              <Image
                size="medium"
                rounded
                alt="logo"
                src="https://technocrete.com.au/wp-content/uploads/2021/07/Logo.svg"
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
          {/* <Grid columns={10}  padded>
        
        <Grid.Column verticalAlign="middle" >
          <Image size="small" rounded alt="logo" src="https://technocrete.com.au/wp-content/uploads/2021/07/Logo.svg"/>
        </Grid.Column>
        <Grid.Column  verticalAlign="middle">
          <Button color="black" icon="bars"onClick={() => setIsSidebarVisible(!isSidebarVisible)}></Button>
        </Grid.Column>

      </Grid> */}
          <Grid columns={1}>
            <Grid.Column>
              <Sidebar.Pushable as={Segment}>
                <Sidebar
                  as={Menu}
                  visible={isSidebarVisible}
                  inverted
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


                  <Menu.Item as="a">
                    <Label color="teal">5</Label>
                    Tasks
                  </Menu.Item>
                  <Menu.Item as="a">
                    <Label color="orange">3</Label>
                    Notifications
                  </Menu.Item>

                  {isAuthenticated ? (
                    <>
                    <LinkContainer to="/iso">
                    <Nav.Link as={Menu.Item}>
                      <span>
                        <Icon name="sitemap" />
                        ISO
                      </span>
                    </Nav.Link>
                  </LinkContainer>

                
                  <LinkContainer to="/templates">
                    <Nav.Link as={Menu.Item}>
                      <span>
                        <Icon name="clipboard list" />
                        Templates
                      </span>
                    </Nav.Link>
                  </LinkContainer>

                  <LinkContainer to="/registers">
                    <Nav.Link as={Menu.Item}>
                      <span>
                        <Icon name="folder open outline" />
                        Register
                      </span>
                    </Nav.Link>
                  </LinkContainer>
                     
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
                    <img alt="logo" src="/iso_cloud.png" />
                  </Menu.Item>
                </Sidebar>

                <Sidebar.Pusher>
                  <Segment basic style={{ minHeight: "100vh" }}>
                    <AppContext.Provider
                      value={{
                        isAuthenticated,
                        userHasAuthenticated,
                        isTopLevelAdmin,
                        currentCustomer,
                        setCurrentCustomer,
                        currentIso,
                        setCurrentIso,
                      }}
                    >
                      {/* <Routes tenant={tenantName} /> */}
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

  const tenantName = window.location.pathname.split('/')[1];
  // Check tenant is valid
  // if (tenantName  != "t1" && tenantName != "t2") return <h1>Wrong way, go back!</h1>;

  return renderApp();
  // return renderNotesApp()
}
