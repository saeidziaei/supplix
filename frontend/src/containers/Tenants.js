import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import {
  Button,
  Divider,
  Grid,
  GridColumn,
  Header,
  Icon,
  Label,
  List,
  Loader,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import pluralize from "pluralize";
import { capitalizeFirstLetter } from "../lib/helpers";
import { Link } from "react-router-dom";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadTenants();
        setTenants(items);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadTenants() {
    return await makeApiCall("GET", `/tenants`);
  }

  function renderTenants() {
    if (!tenants || tenants.length == 0)
      return (
        <Message
          header="No tenats found"
          content="Start by creating your first tenant!"
          icon="exclamation"
        />
      );
    else
      return (
        <>
          <Segment>
            <Header as="h2">Tenants</Header>
            <Divider />

            <Table basic>
              <Table.Body>
              {tenants.map((t) => {
                return (
                  <Table.Row key={t.tenantId}>
                    <Table.Cell>
                      <Icon.Group size="large" >
                        <Icon size="big" name="circle outline" color="yellow" />
                        <Icon size="small" name="users" color="black" />
                      </Icon.Group>
                    </Table.Cell>
                    <Table.Cell>
                      <strong>{t.tenantName}</strong>
                    </Table.Cell>
                    <Table.Cell>{t.contactPerson}</Table.Cell>
                    <Table.Cell>
                      <Link to={`/tenants/${t.tenantId}/users`}>
                        Manage users
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Link to={`/tenant/${t.tenantId}`}>Edit details</Link>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              </Table.Body>
            </Table>
          </Segment>
          <LinkContainer to={`/tenant`}>
            <Button basic primary>New Tenant</Button>
          </LinkContainer>
        </>
      );
  }
  return isLoading ? <Loader active /> : renderTenants();
}
