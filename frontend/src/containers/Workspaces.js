import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import {
  Button,
  Divider,
  Header, Icon, List,
  Loader,
  Message,
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
          <>
            {groupedChildren &&
              groupedChildren.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <Divider horizontal>
                    <Header as="h4">
                      {pluralize(capitalizeFirstLetter(group[0].category))}
                    </Header>
                  </Divider>
                  <Table basic columns="5">
                    <Table.Body>
                      {group &&
                        group.map((d) => {
                          return (
                            <Table.Row key={d.workspaceId}>
                              <Table.Cell>
                                <Icon.Group size="large">
                                  <Icon name="list alternate outline" />
                                  <Icon corner name="clock outline" />
                                </Icon.Group>
                              </Table.Cell>
                              <Table.Cell>
                                <strong>{d.workspaceName}</strong>
                              </Table.Cell>
                              <Table.Cell>{d.note}</Table.Cell>

                              <Table.Cell>
                                <Link to={`/workspace/${d.workspaceId}`}>
                                  Edit Details
                                </Link>
                              </Table.Cell>
                              <Table.Cell>
                                <Link to={`/workspace/${d.workspaceId}/team`} state={d}>
                                  Manage Team
                                </Link>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                    </Table.Body>
                  </Table>
                </div>
              ))}
          </>
        )}
        <Divider hidden />
        <LinkContainer to={`/workspace`}>
          <Button basic primary>
            New
          </Button>
        </LinkContainer>
      </>
    );
  }
  return isLoading ? <Loader active /> : renderWorkspaces();
}
