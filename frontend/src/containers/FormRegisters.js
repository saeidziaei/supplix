import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Icon,
  List, Message, Segment
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormHeader from "../components/FormHeader";
import { useParams } from "react-router-dom";
import { useAppContext } from "../lib/contextLib";

export default function FormRegisters() {
  const [templates, setTemplates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { workspaceId } = useParams();
  const { loadAppWorkspace } = useAppContext();

  useEffect(() => {
    async function onLoad() {

      setIsLoading(true);
      try {
          const templates = await loadTemplates();
          setTemplates(templates);

          loadAppWorkspace(workspaceId);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, []);

  async function loadTemplates() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/templates`);
  }



  function renderTemplatesList() {
    return (
      <>
        <FormHeader heading="Records Register" />
        {(!templates || templates.length == 0) && (
          <Message
            header="No Record found"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
        <Grid>
          <Grid.Column width={10}>        <Segment>
        <List divided relaxed>
          {templates &&
            templates.map((t) => {
              const def = t.templateDefinition;
              return (
                <List.Item key={t.templateId}>
                  <List.Content floated="right">
                    <LinkContainer
                      to={`/workspace/${workspaceId}/form/${t.templateId}`}
                    >
                      <Button basic primary size="small" ><Icon name="pencil"/>
                        New Record
                      </Button>
                    </LinkContainer>
                  </List.Content>
                  <List.Content>
                    <LinkContainer
                      to={`/workspace/${workspaceId}/register/${t.templateId}`}
                    >
                      <List.Header as="a">{def.title}</List.Header>
                    </LinkContainer>
                    <List.Description>{`${t.formCount} ${pluralize(
                      "record",
                      t.formCount
                    )}`}</List.Description>
                  </List.Content>
                </List.Item>
              );
            })}
          
        </List>
        </Segment></Grid.Column>
        </Grid>

      </>
    );
  }

  if (isLoading) return <Loader active />;

  return renderTemplatesList();
}
