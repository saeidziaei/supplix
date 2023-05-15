import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button,
  Header,
  Icon,
  Loader,
  Message,
  Segment
} from "semantic-ui-react";
import { GenericForm } from "../components/GenericForm";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";

export default function TemplatedForm() {
  const { workspaceId, formId, templateId } = useParams();
  const [formRecord, setFormRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
          
          console.log(item.formValues.attachments);
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

  async function uploadFile(file) {
    const fileName = `${Date.now()}-${file.name}`;

    const signedUrl = await makeApiCall("POST", `/docs/upload-url`, {
      fileName: fileName,
      folder: "forms",
      contentType: file.type,
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        const fileContent = event.target.result;

        // Upload the file to S3 using Axios
        await axios.put(signedUrl, fileContent, {
          headers: {
            "Content-Type": file.type,
          },
        });

        resolve(fileName);
      });

      reader.readAsArrayBuffer(file);
    });
  }
  async function updateAttachments(values) {
    setIsUploading(true);
    values.attachments = values.attachments.filter(a => a.file || a.fileName); // the user added attachment line but didn't pick a file. Don't remove the existing attachments

    // Add new attachments
    if (values.attachments && values.attachments.length > 0) {
      const promises = values.attachments.map(async (attachment, i) => {
        if (!attachment.file) return; // this would be an existing attachment. No file picker is shown for existing attachments

        const fileName = await uploadFile(attachment.file);
        values.attachments[i].fileName = fileName;
        delete values.attachments[i].file; // remove the file property as it is not needed to be stored in db
      });

      await Promise.all(promises);
    }

    // Remove unwanted attachments server-side
    if (formRecord && formRecord.formValues && formRecord.formValues.attachments) {
      // find the existing attachments that haven't been deleted
      const existingFileNames = values && values.attachments ?
         values.attachments.map(a => a.fileName)
         :
         [""];
      
      const deletedAttachments = formRecord.formValues.attachments.filter(a => !existingFileNames.includes(a.fileName));
      
      if (deletedAttachments.length > 0) {
        if (!values) {
          values = {};
        }
        values.deletedAttachments = deletedAttachments;
      }
    }

    setIsUploading(false);
  }
  async function handleSubmit(values) {
    

    setIsLoading(true);
    try {
      updateAttachments(values);

      let newFormId;
      if (formId) {
        await updateForm(values);
        // update the formRecord state with the new form data
        const updatedForm = { ...formRecord, formValues: values };
        setFormRecord(updatedForm);
      } else {
        

        const ret = await createForm(values);
        setFormRecord(ret);
        newFormId = ret.formId;
      }

      nav(`/workspace/${workspaceId}/form/${templateId}/${formId||newFormId}`); 
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setIsUploading(false);
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

  if (isUploading) return <Loader active>Uploading attachments</Loader>;

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
        <p style={{ color: "#bbb" }}>
          Created{" "}
          {renderActionInfo(formRecord.createdAt, formRecord.createdByUser)}{" "}
          <br />{" "}
          {formRecord.updatedAt
            ? "Last Edited " +
              renderActionInfo(formRecord.updatedAt, formRecord.updatedByUser)
            : ""}
        </p>
      )}
      {!editable && (
        <div>
          <Button primary size="mini" onClick={() => handleEdit(true)}>
            Revision
          </Button>
          <Button secondary size="mini" onClick={() => handleEdit(false)}>
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
      <LinkContainer to={`/workspace/${workspaceId}/form/${templateId}`}>
        <Button basic primary size="mini">
          <Icon name="pencil" />
          New Record
        </Button>
      </LinkContainer>
      <LinkContainer to={`/workspace/${workspaceId}/register/${templateId}`}>
        <Button basic size="mini">
          All Records...
        </Button>
      </LinkContainer>

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
