import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { makeApiCall } from "../lib/apiLib";
import { useParams } from "react-router-dom";
import { s3Get } from "../lib/awsLib";
import { Button, Header, Icon, Image, Item, Label, Loader, Message, Table } from "semantic-ui-react";
import placeholderImage from './fileplaceholder.jpg'
import { parseISO } from "date-fns";

export default function Users() {
  const { tenantId } = useParams(null);
  const [users, setUsers] = useState([]);
  const [tenant, setTenant] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function onLoad() {
      try {
        const [users, tenant] = await Promise.all([loadUsers(), loadTenant()]);

        setUsers(users);
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
  function getAttribute(user, attributeName) {
    const attribute = user.Attributes.find(
      (attr) => attr.Name === attributeName
    );
    if (attribute) {
      return attribute.Value;
    } else {
      return "";
    }
  }
  function renderUsers() {
    if (!users) return 
    (<Message
    header="No user found"
    content="Start by creating your first user!"
    icon="exclamation"
  />);
  
    return (
      <>
        {tenant && (
          <Message icon="users" content={`You are viewing users of ${tenant.tenantName}`} />
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

        <Table basic="very" celled collapsing>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Action</Table.HeaderCell>
              <Table.HeaderCell>User</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Email Verified</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell>Enabled</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((u) => (
              <Table.Row key={u.Username}>
                <Table.Cell>
                  <LinkContainer
                    key={u.Username}
                    to={
                      tenantId
                        ? `/tenants/${tenantId}/user/${u.Username}`
                        : `/user/${u.Username}`
                    }
                  >
                    <Button basic>Edit</Button>
                  </LinkContainer>
                </Table.Cell>
                <Table.Cell>
                  <Header as="h4" image>
                    <Icon name="user circle" size="mini" />
                    <Header.Content>
                    {`${getAttribute(u, "given_name")} ${getAttribute(u, "family_name")}`}
                      <Header.Subheader></Header.Subheader>
                    </Header.Content>
                  </Header>
                </Table.Cell>
                <Table.Cell>{getAttribute(u, "email")}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Icon
                    size="large"
                    color={
                      getAttribute(u, "email_verified") == "true"
                        ? "green"
                        : "black"
                    }
                    name={
                      getAttribute(u, "email_verified") == "true"
                        ? "check circle outline"
                        : "x"
                    }
                  />
                </Table.Cell>
                <Table.Cell>{getAttribute(u, "phone_number")}</Table.Cell>
                <Table.Cell>
                  <Label basic color={u.Enabled ? "green" : "grey"}>
                    {u.Enabled ? "Yes" : "No"}
                  </Label>
                </Table.Cell>
                <Table.Cell>{u.UserStatus}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <LinkContainer to={`/user`}>
          <Button primary>Create new user</Button>
        </LinkContainer>
      </>
    );
  }


  if (isLoading) return <Loader active/>;

  return renderUsers();
}
