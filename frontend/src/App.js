import React, { useState, useEffect } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import "./App.css";
import Routes from "./Routes";
import { LinkContainer } from "react-router-bootstrap";
import { AppContext } from "./lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

export default App;

function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isTopLevelAdmin, setIsTopLevelAdmin] = useState(false);
  const [jwtToken, setjwtToken] = useState("");

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
      const session = await Auth.currentSession();
      
      const decodedJwt = jwt_decode(session.getAccessToken().getJwtToken());
      setIsTopLevelAdmin(decodedJwt["cognito:groups"] && decodedJwt["cognito:groups"].includes("top-level-admins"));

      userHasAuthenticated(true);
      setjwtToken(session.getAccessToken().getJwtToken())
    } catch (e) {
      if (e !== "No current user") {
        alert(e);
      }
    }
    
    setIsAuthenticating(false);
  }

  return (
    !isAuthenticating && (
    <div className="App container py-3">
      <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
        <LinkContainer to="/">
          <Navbar.Brand className="font-weight-bold text-muted">
            ISO Cloud {isTopLevelAdmin ? <div>Hi Top Gun!</div> : <div>Hey Consultant</div>}
          </Navbar.Brand>
          
        </LinkContainer>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav activeKey={window.location.pathname}>
            {isAuthenticated ? (
              <>
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                
                <LinkContainer to="/forms/NewEmployeeInductionChecklist/3324ee90-8fbe-11ed-a7e7-d3e89492ec58"><Nav.Link>Test</Nav.Link></LinkContainer>
              </>
            ) : (
              <>
                <LinkContainer to="/signup"><Nav.Link>Signup</Nav.Link></LinkContainer>
                <LinkContainer to="/login"><Nav.Link>Login</Nav.Link></LinkContainer>
                
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated, isTopLevelAdmin, jwtToken }}>
        <Routes />
      </AppContext.Provider>
    </div>
    )
  );
}
