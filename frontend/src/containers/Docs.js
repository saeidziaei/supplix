import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { Button, Divider, Header, Icon, Label, List, Loader, Message, Segment } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import  pluralize from "pluralize";
import { capitalizeFirstLetter } from '../lib/helpers';
import FormHeader from "../components/FormHeader";
import { useParams } from "react-router-dom";
import { useAppContext } from "../lib/contextLib";

export default function Docs() {
  const [docs, setDocs] = useState([]);
  const { workspaceId } = useParams();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadDocs();
        const modifiedItems = items.map((item) => {
          const fileNameWithoutFolder = item.fileName?.replace(/^docs\//, "");
          return { ...item, fileNameWithoutFolder };
        });
        
        setDocs(modifiedItems);
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

    return (<>
    <FormHeader heading="Library" />
    {
      (!docs || docs.length == 0) && (
        <Message
          header="No docs found in your library"
          content="Start by creating your first doc!"
          icon="exclamation"
        />
      )
    }
    {
      docs && docs.length > 0 && (
        <>
          
          <Divider />
          {groupedChildren &&
            groupedChildren.map((group, groupIndex) => (
              <div key={groupIndex}>
                <Divider horizontal>
                  <Header as="h4">
                    {pluralize(capitalizeFirstLetter(group[0].category || ""))}
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
                            <LinkContainer to={`/workspace/${workspaceId}/doc/${d.docId}`}>
                              <List.Header as="a">{d.fileNameWithoutFolder}</List.Header>
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
      )
    }
    <Divider hidden/>
    <LinkContainer to={`/workspace/${workspaceId}/doc`}>
      <Button size="mini"  basic primary><Icon name="plus"/>New</Button>
    </LinkContainer>
    </>);
  }
  return isLoading ? (<Loader active/>) : renderDocs();
}
