import React, { useEffect, useState } from "react";
import {
  Button, Card,
  Divider,
  Message
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";

export default function FormTemplates() {
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
    return await makeApiCall("GET", `/templates`);
  }

  function renderTemplate(t) {
    const td = t.templateDefinition;
    let fieldCount = 0;
    if (td && td.sections) 
      td.sections.forEach(s => fieldCount += s.fields.length);
    return (
      <LinkContainer key={t.templateId} to={`/template/${t.templateId}`} as="a">
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
    <FormHeader heading="Forms" />
      <Card.Group>
        {templates.map((t) => renderTemplate(t))}
        {templates.length == 0 && (
          <Message
            header="No Record found"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
      </Card.Group>
      <Divider />
      <LinkContainer to={`/template`}>
        <Button basic primary>
          Create New Form
        </Button>
      </LinkContainer>
    </>
  );
}
