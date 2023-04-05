import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button,
  Divider,
  Header,
  Icon,
  Loader,
  Message,
  Segment,
} from "semantic-ui-react";
import { GenericForm } from "../components/GenericForm";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";

export default function TemplatedForm() {
  const { formId, templateId } = useParams();
  const [formData, setFormData] = useState(null);
  const [formHistory, setFormHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRevisioning, setIsRevisioning] = useState(false);
  const [template, setTemplate] = useState(null);
  const [activeAccordionIndex, setActiveAccordionIndex] = useState(-1);
  const nav = useNavigate();

  useEffect(() => {
    async function loadForm() {
      return await makeApiCall("GET", `/forms/${formId}`);
    }

    async function loadTemplate() {
      return await makeApiCall("GET", `/templates/${templateId}`);
    }
    async function onLoad() {
      try {
        if (formId) {
          const item = await loadForm();

          setFormData(item.formValues);
          setFormHistory(item.history);
          // the api populates template as well
          setTemplate(item.template);
        } else {
          // new form - just load the template
          const item = await loadTemplate();

          setTemplate(item);
        }
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
      nav(`/register/${templateId}`); // todo navigate to form register page ??
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function createForm(values) {
    return await makeApiCall("POST", `/forms`, {
      templateId: template.templateId,
      formValues: values,
    });
  }

  async function updateForm(values) {
    return await makeApiCall("PUT", `/forms/${formId}`, {
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

  if (isLoading) return <Loader active />;

  if (!template || !template.templateDefinition) {
    return (
      <Segment>
        <Header as="h3">Form definition does not exist.</Header>
      </Segment>
    );
  }

  // enable editing if
  //    it is a new form (formId = undefined)
  //    or it is being edited
  //    or it is being revisioned
  const editable = !formId || isEditing || isRevisioning;
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
        formData={formData}
        handleSubmit={handleSubmit}
        handleCancel={cancelEdit}
        disabled={!editable}
      />
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
            formsInput={formHistory}
            isHistory={true}
          />
        </Accordion.Content>
      </Accordion>
    </>
  );
}
