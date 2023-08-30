import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Header,
  Icon,
  List, Message, Segment, Table
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormHeader from "../components/FormHeader";
import { Link, useParams } from "react-router-dom";
import "./FormRegisters.css";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";

export default function FormRegisters() {
  const [templates, setTemplates] = useState(null);
  const [workspace, setWorkspace] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const { workspaceId } = useParams();

  useEffect(() => {
    async function onLoad() {

      setIsLoading(true);
      try {
          const templates = await loadTemplates();
          const { data, workspace } = templates ?? {};

          if (workspace && workspace.templateIds && workspace.templateIds.length) {
            // Filter the templates based on the templateIds in the workspace
            const filteredTemplates = data.filter((template) =>
              workspace.templateIds.includes(template.templateId)
            );
            
            setTemplates(filteredTemplates);
          } else {
            setTemplates(data);
          }

          
          setWorkspace(workspace);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, [workspaceId]);

  async function loadTemplates() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/templates`);
  }

  function renderCategories() {
    if (templates && templates.length) {
      let categories = ['ALL'].concat([...new Set(templates.map(t => t.templateDefinition.category))]);
      
      return (
        <List horizontal size="large">
          {categories.map((category, index) => (
            <List.Item key={index} as={category === selectedCategory ? "span" : "a"} onClick={() => setSelectedCategory(category)}>{category}</List.Item>
          ))}
        </List>
      );
    } 
  }

  function renderTemplatesList() {
    return (
      <>
        <FormHeader heading="Records Register" />
        <WorkspaceInfoBox workspace={workspace} />
        {(!templates || templates.length == 0) && (
          <Message
            header="No Record found"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
        {renderCategories()}

        <Grid columns={2} doubling>
          <Grid.Row>
            <Grid.Column>
              <Segment>
                <List divided relaxed>
                  {templates &&
                    templates
                      .filter(
                        (t) =>
                          selectedCategory === "ALL" ||
                          selectedCategory === t.templateDefinition.category
                      )
                      .map((t) => {
                        const def = t.templateDefinition;
                        return (
                          <List.Item key={t.templateId}>
                            <List.Content floated="right">
                              <LinkContainer
                                to={`/workspace/${workspaceId}/form/${t.templateId}`}
                              >
                                <Button
                                  basic
                                  primary
                                  size="mini"
                                  disabled={t.isDeleted}
                                >
                                  <Icon name="add" />
                                  Record
                                </Button>
                              </LinkContainer>
                            </List.Content>

                            <List.Icon
                              name="newspaper outline"
                              size="large"
                              verticalAlign="middle"
                              className="custom-blue-icon"
                            />
                            <List.Content>
                              <List.Header>{def.title}</List.Header>
                              <List.Description>
                                <Link
                                  to={`/workspace/${workspaceId}/register/${t.templateId}`}
                                >
                                  
                                  {`${t.formCount} ${pluralize(
                                    "record",
                                    t.formCount
                                  )}`}
                                </Link>
                              </List.Description>
                            </List.Content>
                          </List.Item>
                        );
                      })}
                </List>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  return renderTemplatesList();
}
