import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Button, Divider, Header, Icon, List, Loader, Message } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter } from '../lib/helpers';

export default function Docs() {
  const [docs, setDocs] = useState([]);
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadDocs();
        // loadDocs has workspaceId in the path therefore items are in data element and it also returns workspace
        const { data, workspace } = items ?? {};

        const modifiedItems = data.map((item) => {
          const fileNameWithoutFolder = item.fileName?.replace(/^docs\//, "");
          return { ...item, fileNameWithoutFolder };
        });
        
        setDocs(modifiedItems);
        setWorkspace(workspace);

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadDocs() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/docs`);
  }



  
  function renderDocs() {
    const groupedChildren =
      !docs || docs.length == 0
        ? []
        : docs.reduce((result, child) => {
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
        <WorkspaceInfoBox workspace={workspace} />

        <FormHeader heading="Library" />
        {(!docs || docs.length == 0) && (
          <Message
            header="No docs found in your library"
            content="Start by creating your first doc!"
            icon="exclamation"
          />
        )}
        {docs && docs.length > 0 && (
          <>
            <Divider />
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
                          <List.Item key={d.docId}>
                            <List.Icon
                              name="file text outline"
                              color="blue"
                              size="large"
                              verticalAlign="middle"
                            />
                            <List.Content>
                              <LinkContainer
                                to={`/workspace/${workspaceId}/doc/${d.docId}`}
                              >
                                <List.Header as="a">
                                  {d.fileNameWithoutFolder}
                                </List.Header>
                              </LinkContainer>

                              {d.note}
                            </List.Content>
                          </List.Item>
                        );
                      })}
                  </List>
                </div>
              ))}
          </>
        )}
        <Divider hidden />
        <LinkContainer to={`/workspace/${workspaceId}/doc`}>
          <Button size="mini" basic primary>
            <Icon name="plus" />
            New
          </Button>
        </LinkContainer>
      </>
    );
  }
  return isLoading ? (<Loader active/>) : renderDocs();
}
