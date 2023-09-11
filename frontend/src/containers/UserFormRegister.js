import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Grid, Header, Icon, Item, Loader, Table } from "semantic-ui-react";
import User from "../components/User";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { normaliseCognitoUser } from "../lib/helpers";
import "./UserFormRegister.css"

export default function UserFormRegister() {
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useParams();

  const [forms, setForms] = useState([]);
  const [user, setUser] = useState(null);
  const nav = useNavigate()


  useEffect(() => {
    async function loadForms() {
      return await makeApiCall("GET", `/users/forms/${username}`);
    }
    async function loadUser() {
      return await makeApiCall("GET", `/users/${username}`);
    }
    async function loadFormWithTemplate(form) {
      let workspaceId = form.workspaceId;
      if (!workspaceId) {
        const parts = form.tenant_workspaceId.split("_");
        workspaceId = parts[1]; // Get the second part of the array (index 1)
      }

      const ret = await makeApiCall(
        "GET",
        `/workspaces/${workspaceId}/forms/${form.formId}`
      );
      const { data, workspace } = ret ?? {};
      data.workspace = workspace;

      return data;
    }

    async function onLoad() {
      try {
        setIsLoading(true);
        const [forms, user] = await Promise.all([loadForms(), loadUser()]);

        // forms witout template. Need to make calls to get form + template

        const formsWithTemplates = await Promise.all(
          forms.map((form) => loadFormWithTemplate(form))
        );

        setForms(formsWithTemplates);

        setUser(normaliseCognitoUser(user));
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false);
      }
    }
    onLoad();
  }, []);

  function extractTextValues(data) {
    const textValues = [];

    try {
      if (
        data.formValues &&
        data.template &&
        data.template.templateDefinition
      ) {
        const { formValues } = data;
        const templateFields = data.template.templateDefinition.sections[0].fields;

        // Iterate through the template fields
        for (const field of templateFields) {
          if (field.type === "text" || field.type === "select") {
            // Check if the field type is 'text'
            const fieldName = field.name;
            const fieldValue = formValues[fieldName];

            // Add the field name and value to the textValues array
            if (fieldValue !== undefined) {
              textValues.push({fieldName, fieldValue });
            }
          }

          // Break the loop after finding the first 3 text values
          if (textValues.length >= 3) {
            break;
          }
        }
      }
    } catch {
      // igonre
    }

    return textValues;
  }

  const renderFormCards = () => {
    if (!forms || forms.length === 0) return <p>No Employee Records Found</p>;

    return (
      <Card.Group itemsPerRow="2" doubling="true">
        {forms.map((form) => {
          const def = form.template?.templateDefinition;
          const textValues = extractTextValues(form);
          return (
            <Card>
              <Card.Content header={def.title} />

              <Card.Content>
                <Table basic compact size="small">
                  <Table.Body>
                  {textValues.map((v) => (
                    <Table.Row>
                      <Table.Cell>{v.fieldName}</Table.Cell>
                      <Table.Cell className="bold">{v.fieldValue}</Table.Cell>
                    </Table.Row>
                  ))}
                  </Table.Body>
                </Table>
                

                <Card.Meta>
                  {new Date(form.createdAt).toLocaleDateString()}
                </Card.Meta>
              </Card.Content>
              <Card.Content extra>
                <Icon name="folder" />
                {form.workspace.workspaceName}
                <Button basic size="tiny" floated="right" circular icon="external alternate" onClick={() => nav(`/workspace/${form.workspace.workspaceId}/form/${form.templateId}/${form.formId}`)}/>
              </Card.Content>
            </Card>
          );
        })}
      </Card.Group>
    );
  }



  if (isLoading) return <Loader active />;

  return (
    <Grid stackable>
      <Grid.Column width={4}>
        <User card="true"  user={user} />
      </Grid.Column>
      <Grid.Column width={12}>
        {renderFormCards()}
      </Grid.Column>
    </Grid>
  );
}
