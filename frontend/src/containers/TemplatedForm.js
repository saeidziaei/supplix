import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button, Header,
  Icon,
  Loader,
  Message,
  Segment
} from "semantic-ui-react";
import { GenericForm } from "../components/GenericForm";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";
import { useAppContext } from "../lib/contextLib";

export default function TemplatedForm() {
  const { workspaceId, formId, templateId } = useParams();
  const [formRecord, setFormRecord] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRevisioning, setIsRevisioning] = useState(false);
  const [template, setTemplate] = useState(null);
  const [activeAccordionIndex, setActiveAccordionIndex] = useState(-1);
  const nav = useNavigate();
  const { loadAppWorkspace } = useAppContext();

  useEffect(() => {
    async function loadForm() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/forms/${formId}`);
    }

    async function loadTemplate() {
      return await makeApiCall("GET", `/templates/${templateId}`);
    }
    async function onLoad() {
      try {
        if (formId) {
          const item = await loadForm();
          setFormRecord(item);
          
          // the api populates template as well
          setTemplate(item.template);
        } else {
          // new form - just load the template
          const item = await loadTemplate();

          setTemplate(item);
        }
        loadAppWorkspace(workspaceId);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function handleSubmit(values) {
    setIsLoading(true);
    try {
      if (formId) {
        await updateForm(values);
      } else {
        await createForm(values);
      }
      nav(`/workspace/${workspaceId}/register/${templateId}`); // todo navigate to form register page ??
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function createForm(values) {
    return await makeApiCall("POST", `/workspaces/${workspaceId}/forms`, {
      templateId: template.templateId,
      formValues: values,
    });
  }

  async function updateForm(values) {
    return await makeApiCall("PUT", `/workspaces/${workspaceId}/forms/${formId}`, {
      formValues: values,
      isRevision: isRevisioning
    });
  }

  function handleEdit(revision) {
    if (revision) {
      setIsRevisioning(true);
    } else {
      setIsEditing(true);
    }
  }
  function cancelEdit() {
    setIsEditing(false);
    setIsRevisioning(false);
  }

  const handleAccordionClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeAccordionIndex === index ? -1 : index

    setActiveAccordionIndex(newIndex);
  }
  const renderActionInfo = (ts, user) => {
    const date = new Date(ts);
    
    return (ts ? date.toLocaleString() : "") + " by " + (user ? `${user.firstName} ${user.lastName}` : "");
  }
  if (isLoading) return <Loader active />;

  if (!template || !template.templateDefinition) {
    return (
      <Segment>
        <Header as="h3">Form definition does not exist.</Header>
      </Segment>
    );
  }

  // enable editing if
  //    it is a new form (no formId)
  //    or it is being edited
  //    or it is being revisioned
  const isNew = !formId;
  const editable = isNew || isEditing || isRevisioning;
  return (
    <>
      <Header as="h2">
        {!formId
          ? "New Record"
          : isEditing
          ? "Edit"
          : isRevisioning
          ? "Revision"
          : ""}
      </Header>
      <GenericForm
        formDef={template.templateDefinition}
        formData={formRecord ? formRecord.formValues : null}
        handleSubmit={handleSubmit}
        handleCancel={isNew ? null : cancelEdit}
        disabled={!editable}
      />
      {formRecord && (
        <p>
          Created{" "}
          {renderActionInfo(formRecord.createdAt, formRecord.createdByUser)}{" "}
          <br />{" "}
          {formRecord.updatedAt
            ? "Update " +
              renderActionInfo(formRecord.createdAt, formRecord.createdByUser)
            : ""}
        </p>
      )}
      {!editable && (
        <div>
          <Button primary onClick={() => handleEdit(true)}>
            Revision
          </Button>
          <Button secondary onClick={() => handleEdit(false)}>
            Edit
          </Button>
        </div>
      )}
      {formId && (
        <Message icon>
          <Icon name="info" />
          <Message.Content>
            <p>
              <strong>Revision</strong> archives the current version and creates
              a new editable record initially with the same information as the
              current record.
            </p>
            <p>
              <strong>Edit</strong> is similar but it does not keep history.
              Most of the times it is better to use <strong>Revision</strong>
            </p>
          </Message.Content>
        </Message>
      )}
      {formRecord && formRecord.history && (
        <Accordion>
          <Accordion.Title
            active={activeAccordionIndex === 0}
            index={0}
            onClick={handleAccordionClick}
          >
            <Icon name="dropdown" />
            <a href="#">History</a>
          </Accordion.Title>
          <Accordion.Content active={activeAccordionIndex === 0}>
            <FormRegister
              formDefInput={template.templateDefinition}
              formsInput={formRecord.history}
              isHistory={true}
            />
          </Accordion.Content>
        </Accordion>
      )}
    </>
  );
}
