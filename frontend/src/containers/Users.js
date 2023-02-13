import React, { useState, useEffect } from "react";
import { BsPencilSquare } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { makeApiCall } from "../lib/apiLib";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const users = await loadUsers();
        setUsers(users);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadUsers() {
    return await makeApiCall("GET", `/users`);
  }
  function getAttribute(user, attributeName) {
    const attribute = user.Attributes.find(
      (attr) => attr.Name === attributeName
    );
    if (attribute) {
      return attribute.Value;
    } else {
      return undefined;
    }
  }
  function renderUserList(users) {
    if (!users) return <div>No user found</div>
    return (
      <>
        <LinkContainer to={`/user`}>
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">
              Create a new User
            </span>
          </ListGroup.Item>
        </LinkContainer>
        {users.map((u) => (
          <LinkContainer
            key={u.Username}
            to={`/user/${u.Username}`}
          >
            <ListGroup.Item action>
              <span className="font-weight-bold">{getAttribute(u, "email")}</span>
              <br />
              <span className="font-weight-bold">Other User Data</span>
              <br />
              <span className="text-muted">User Create Date {u.UserCreateDate}</span> <br/>
              <span className="text-muted">User Last Modified Date {u.UserLastModifiedDate}</span> <br/>
              <span className="text-muted">Enabled {u.Enabled}</span> <br/>
              <span className="text-muted">User Status {u.UserStatus}</span> <br/>

              
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }
  function renderUsers() {
    return (
      <div className="users">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Users</h2>
        <ListGroup>{!isLoading && renderUserList(users)}</ListGroup>
      </div>
    );
  }
  return renderUsers();
}
