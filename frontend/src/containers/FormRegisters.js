import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import {
  List, Message
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormHeader from "../components/FormHeader";

export default function FormRegister() {
  const [templates, setTemplates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {

      setIsLoading(true);
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
        <List divided relaxed>
          {templates &&
            templates.map((t) => {
              const def = t.templateDefinition;
              return (
                <List.Item key={t.templateId}>
                  <List.Icon
                    name="folder open outline"
                    color="blue"
                    size="large"
                    verticalAlign="middle"
                  />
                  <List.Content>
                    <LinkContainer to={`/register/${t.templateId}`}>
                      <List.Header as="a">{def.title}</List.Header>
                    </LinkContainer>
                    <List.Description>{`${t.formCount} ${pluralize("record", t.formCount)}`}</List.Description>
                  </List.Content>
                </List.Item>
              );
            })}
          
        </List>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  return renderTemplatesList();
}
