import React, { useEffect, useState } from "react";
import { Button, Card, Divider, Icon, Message } from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";

export default function NFormTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  async function loadTemplates() {
    return await makeApiCall("GET", `/ntemplates`);
  }

  function renderTemplate(t) {
    const td = t.templateDefinition;
    let fieldCount = 0;
    if (td && td.sections)
      td.sections.forEach((s) => (fieldCount += s.fields.length));
    return (
      <LinkContainer
        key={t.templateId}
        to={`/ntemplate/${t.templateId}`}
        as="a"
      >
        <Card>
          <Card.Content>
            <Card.Header>{td.title}</Card.Header>
            <Card.Meta>{fieldCount} fields</Card.Meta>
          </Card.Content>
        </Card>
      </LinkContainer>
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
      <LinkContainer to={`/ntemplate`}>
        <Button basic primary>
          Create New Template
        </Button>
      </LinkContainer>
    </>
  );
}
