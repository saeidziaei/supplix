import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import {
  Button,
  Divider,
  Grid,
  Header, Icon, List,
  Loader,
  Message,
  Segment,
  Table
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter } from "../lib/helpers";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadWorkspaces();
        setWorkspaces(items);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadWorkspaces() {
    return await makeApiCall("GET", `/workspaces`);
  }



  function renderWorkspaces() {
    const groupedChildren =
    !workspaces || workspaces.length == 0
      ? []
      : workspaces.reduce((result, child) => {
          const group = result.find(
            (group) => group[0].category === child.category
          );

          if (group) {
            group.push(child);
          } else {
            result.push([child]);
          }

          return result;
        }, []);

    return (
      <>
        <FormHeader heading="Workspaces" />
        {(!workspaces || workspaces.length == 0) && (
          <Message
            header="No workspaces found"
            content="Start by creating your first workspace!"
            icon="exclamation"
          />
        )}
        {workspaces && workspaces.length > 0 && (
          <Grid>
            <Grid.Column width={10}>
              <Segment>
                {groupedChildren &&
                  groupedChildren.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <Divider horizontal>
                        <Header as="h4">
                          {pluralize(
                            capitalizeFirstLetter(group[0].category || "")
                          )}
                        </Header>
                      </Divider>

                      <List divided relaxed>
                        {group &&
                          group.map((d) => {
                            return (
                              <List.Item key={d.workspaceId}>
                                <List.Content floated="right">
                                  <LinkContainer
                                    to={`/workspace/${d.workspaceId}`}
                                  >
                                    <Button basic primary size="mini">
                                      <Icon name="pencil" />
                                      Edit Details
                                    </Button>
                                  </LinkContainer>
                                  <LinkContainer
                                    to={`/workspace/${d.workspaceId}/team`}
                                  >
                                    <Button basic size="mini">
                                      Manage Team
                                    </Button>
                                  </LinkContainer>
                                </List.Content>
                                <List.Content>
                                  <List.Header>{d.workspaceName}</List.Header>
                                  <List.Description>{d.note}</List.Description>
                                </List.Content>
                              </List.Item>
                            );
                          })}
                      </List>
                    </div>
                  ))}
              </Segment>
            </Grid.Column>
          </Grid>
        )}
        <Divider hidden />
        <LinkContainer to={`/workspace`}>
          <Button basic primary size="small">
            New Workspace
          </Button>
        </LinkContainer>
      </>
    );
  }
  return isLoading ? <Loader active /> : renderWorkspaces();
}
