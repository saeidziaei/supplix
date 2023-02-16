import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
  List,
  Segment,
  Card,
  Divider,
  Item,
  Message,
} from "semantic-ui-react";
import  pluralize from "pluralize";

import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { Loader, Header, Table } from "semantic-ui-react";
import { parseISO } from "date-fns";
import { NumericFormat } from "react-number-format";
import { makeApiCall } from "../lib/apiLib";

export default function FormRegister() {
  const [templates, setTemplates] = useState(null);
  const customerIsoId = "iso-123";
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
    return await makeApiCall("GET", `/customer-isos/${customerIsoId}/templates`);
  }



  function renderTemplatesList() {
    return (
      <>
        {(!templates || templates.length == 0) && (
          <Message
            header="No Template found"
            content="Start by creating your first template!"
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
                    <List.Description>{`${t.formCount} ${pluralize("entry", t.formCount)}`}</List.Description>
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