import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import {
  Button,
  Divider, Header,
  Icon, Loader,
  Message,
  Segment,
  Table
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import "./Tenants.css"

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
    return (
      <>
        <FormHeader heading="Tenants" />
        {(!tenants || tenants.length == 0) && (
          <Message
            header="No tenants found"
            content="Start by creating your first tenant!"
            icon="exclamation"
          />
        )}
        {tenants && tenants.length > 0 && (
            <Table basic columns="5">
              <Table.Body>
                {tenants.map((t) => {
                  return (
                    <Table.Row key={t.tenantId}>
                      <Table.Cell >
                        <Icon.Group size="huge" className="custom-blue-icon">
                          <Icon name="building" />
                          <Icon  name="users"  corner="bottom right" />
                        </Icon.Group>
                      </Table.Cell>
                      <Table.Cell >
                        <strong>{t.tenantName}</strong>
                      </Table.Cell>
                      <Table.Cell >{t.contactPerson}</Table.Cell>
                      <Table.Cell>
                        <Link to={`/tenants/${t.tenantId}/users`}>
                          Manage Users
                        </Link>
                      </Table.Cell>
                      <Table.Cell >
                        <Link to={`/tenant/${t.tenantId}`}>Edit Details</Link>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
        )}
        <LinkContainer to={`/tenant`}>
          <Button basic primary>
            New Tenant
          </Button>
        </LinkContainer>
      </>
    );
  }
  return isLoading ? <Loader active /> : renderTenants();
}
