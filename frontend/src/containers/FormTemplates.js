import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import {
  Button, Card,
  Divider,
  Grid,
  Header,
  Icon,
  List,
  Loader,
  Message,
  Segment
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import "./FormTemplates.css";

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
      <List.Item key={t.templateId}>
        <List.Content floated="right">
          <LinkContainer to={`/template/${t.templateId}`}>
            <Button basic primary size="mini">
              <Icon name="pencil" />
              Change Form Design
            </Button>
          </LinkContainer>
        </List.Content>
        <List.Icon name='file alternate' size='large' verticalAlign='middle' className="custom-green-icon" />
        <List.Content>
          <List.Header>{t.templateDefinition.title}</List.Header>
          <List.Description>{fieldCount} fields</List.Description>
        </List.Content>
      </List.Item>
    );
  }



  if (isLoading) return <Loader active />;
  const groupedChildren =
  !templates || templates.length == 0
    ? []
    : templates.reduce((result, child) => {
        const group = result.find(
          (group) => group[0].templateDefinition.category === child.templateDefinition.category
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
      <FormHeader heading="Forms" />
{ templates && templates.length > 0 && (
        <>
          <Divider />
          <Grid columns={2} doubling>
          <Grid.Column >
            <Segment>

          {groupedChildren &&
            groupedChildren.map((group, groupIndex) => (
              <div key={groupIndex}>
                <Divider horizontal>
                  <Header as="h4">
                    {group[0].templateDefinition.category || "-"}
                  </Header>
                </Divider>
                <List divided relaxed>
                  {group &&
                    group.map((t) => renderTemplate(t))}
                </List>
              </div>
            ))}
            </Segment>
          </Grid.Column>
        </Grid>
        </>
      )}

        
        {templates.length == 0 && (
          <Message
            header="No Record found"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
      <Divider />
      <LinkContainer to={`/template`}>
        <Button basic primary>
          Design New Form
        </Button>
      </LinkContainer>
    </>
  );
}
