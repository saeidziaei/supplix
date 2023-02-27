import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { Button, Divider, Header, Label, List, Loader, Message, Segment } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import  pluralize from "pluralize";
import { capitalizeFirstLetter } from '../lib/helpers';

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
    if (!tenants || tenants.length == 0) return  (<Message
    header="No tenats found"
    content="Start by creating your first tenant!"
    icon="exclamation"
  />); else return (<>
    <Segment>
      <Header as="h2">Tenants</Header>
      <Divider />
  
            <List divided relaxed>
              {tenants.map((t) => {
                  return (
                    <List.Item key={t.tenantId}>
                      <List.Icon
                        name="warehouse"
                        color="blue"
                        size="large"
                        verticalAlign="middle"
                      />
                      <List.Content>
                        <LinkContainer to={`/tenant/${t.tenantId}`}>
                          <List.Header as="a">{t.tenantName}</List.Header>
                        </LinkContainer>
                        {t.contactPerson}
                      </List.Content>
                    </List.Item>
                  );
                })}
            </List>
          
        
    </Segment>
    <LinkContainer to={`/doc`}><Button>New</Button></LinkContainer> </>
  );
  }
  return isLoading ? (<Loader active/>) : renderTenants();
}
