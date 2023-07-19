import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import {
  Button,
  Divider,
  Grid,
  Header, Icon, List,
  Loader,
  Message,
  Segment
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import "./Workspaces.css";
import { useAppContext } from "../lib/contextLib";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");


  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadWorkspaces();
        setWorkspaces(items);
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false);
      }
    }

    onLoad();
  }, []);

  async function loadWorkspaces() {
    // if admin return all
    if (isAdmin) {
      return await makeApiCall("GET", `/workspaces`);
    }

    // return only workspaces that the user is admin of
    const myWorkspace = await makeApiCall("GET", `/myworkspaces`);
    return myWorkspace.filter(ws => ws.role === "Owner")
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
        <FormHeader heading="Workspaces" subheading="You are the owner of these workspaces" />
        {(!workspaces || workspaces.length == 0) && (
          <Message
            header="No workspaces found"
            icon="exclamation"
          />
        )}
        {workspaces && workspaces.length > 0 && (
          <Grid columns={2} doubling>
            <Grid.Column >
              <Segment>
                {groupedChildren &&
                  groupedChildren.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <Divider horizontal>
                        <Header as="h4">
                          {group[0].category || ""}
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
                                <List.Icon name='laptop' size='large' verticalAlign='middle' className="custom-orange-icon" />
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
        {isAdmin && (
        <LinkContainer to={`/workspace`}>
          <Button basic primary size="tiny">
            <Icon name="plus"/>Workspace
          </Button>
        </LinkContainer>
        )}
      </>
    );
  }
  return isLoading ? <Loader active /> : renderWorkspaces();
}
