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
  const [selectedCategory, setSelectedCategory] = useState("ALL");
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

  function renderCategories() {
    if (templates && templates.length) {
      let categories = ['ALL'].concat([...new Set(templates.map(t => t.templateDefinition.category))]);
      
      return (
        <List horizontal size="large">
          {categories.map((category) => (
            <List.Item as={category === selectedCategory ? "span" : "a"} onClick={() => setSelectedCategory(category)}>{category}</List.Item>
          ))}
        </List>
      );
    } 
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
        {renderCategories()}
        <Grid>
          <Grid.Column width={10}>
            <Segment>
              <List divided relaxed>
                {templates &&
                  templates.filter(t => selectedCategory === "ALL" || selectedCategory === t.templateDefinition.category).map((t) => {
                    const def = t.templateDefinition;
                    return (
                      <List.Item key={t.templateId}>
                        <List.Content floated="right">
                          <LinkContainer
                            to={`/workspace/${workspaceId}/form/${t.templateId}`}
                          >
                            <Button basic primary size="mini">
                              <Icon name="pencil" />
                              New Record
                            </Button>
                          </LinkContainer>
                          <LinkContainer
                            to={`/workspace/${workspaceId}/register/${t.templateId}`}
                          >
                            <Button basic size="mini">
                              All Records...
                            </Button>
                          </LinkContainer>
                        </List.Content>
                        <List.Content>
                          <List.Header>{def.title}</List.Header>
                          <List.Description>{`${t.formCount} ${pluralize(
                            "record",
                            t.formCount
                          )}`}</List.Description>
                        </List.Content>
                      </List.Item>
                    );
                  })}
              </List>
            </Segment>
          </Grid.Column>
        </Grid>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  return renderTemplatesList();
}
