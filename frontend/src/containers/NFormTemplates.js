import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
  List,
  Segment,
  Card,
  Divider,
  Item,
  Message,
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import { Loader, Header, Table } from "semantic-ui-react";

export default function NFormTemplates() {
  const [templates, setTemplates] = useState([]);
  const customerId = "c-123";
  const [isLoading, setIsLoading] = useState(true);
  const callJwtAPI = JwtApi();

  useEffect(() => {
    async function onLoad() {
      try {
        const templates = await loadTemplates();

        setTemplates(templates);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function loadTemplates() {
    return callJwtAPI("GET", `/customers/${customerId}/ntemplates`);
  }

  function renderTemplate(t) {
    const td = t.templateDefinition;
    let fieldCount = 0;
    if (td && td.sections) 
      td.sections.forEach(s => fieldCount += s.fields.length);
    return (
      <Card key={t.templateId}>
        <Card.Content>
          <Card.Header>{td.title}</Card.Header>
          <Card.Meta>{fieldCount} fields</Card.Meta>
        </Card.Content>
        <Card.Content extra>
          <div className="ui one buttons">
            <LinkContainer
              key={t.templateId}
              to={`/ntemplate/${t.templateId}`}
              as="a"
            >
              <Button basic color="blue" compact >
                <Icon name="pencil" />
                Edit
              </Button>
            </LinkContainer>
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (isLoading) return <Loader active />;

  return (
    <>
      <Card.Group>
        {templates.map((t) => renderTemplate(t))}
        {templates.length == 0 && (
          <Message
            header="No Template found"
            content="Start by creating your first template!"
            icon="exclamation"
          />
        )}
      </Card.Group>
      <Divider />
      <LinkContainer to={`/template`}>
        <Button basic primary>
          Create New Template
        </Button>
      </LinkContainer>
    </>
  );
}
