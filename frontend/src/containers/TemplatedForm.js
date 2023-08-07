import axios from "axios";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button,
  Confirm,
  Header,
  Icon,
  Label,
  Loader,
  Message,
  Popup,
  Segment
} from "semantic-ui-react";
import { GenericForm } from "../components/GenericForm";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";
import "./TemplatedForm.css"

// This is a single record component. It uses FormRegister (which is used to show a list of records) to show the history of changes on this record. A bit confusing!
export default function TemplatedForm() {
  const { workspaceId, formId, templateId } = useParams();
  const [formRecord, setFormRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRevisioning, setIsRevisioning] = useState(false);
  const [template, setTemplate] = useState(null);
  const [activeAccordionIndex, setActiveAccordionIndex] = useState(-1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workspace, setWorkspace] = useState(null); 

  const nav = useNavigate();
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  useEffect(() => {
    async function loadForm() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/forms/${formId}`);
    }

    async function loadTemplate() {
      return await makeApiCall("GET", `/templates/${templateId}`);
    }
    async function loadWorkspace() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}`);
    }

    async function onLoad() {
      try {
        setIsLoading(true);

        if (formId) {
          const item = await loadForm();
          const { data, workspace } = item ?? {};
          setFormRecord(data);
          setWorkspace(workspace);
          // the api populates template as well
          setTemplate(data.template);
        } else {
          // new form - just load the template and workspace
          const item = await loadTemplate();
          setTemplate(item);
          const result = await loadWorkspace();
          const { workspace } = result ?? {};
          setWorkspace(workspace);
        }
        
        
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false);
      }
    }

    onLoad();
  }, [formId]);

  async function uploadFile(file) {

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        const fileName = `${Date.now()}-${file.name}`;

        const signedUrl = await makeApiCall("POST", `/docs/upload-url`, {
          fileName: fileName,
          folder: "forms",
          contentType: file.type,
        });

        const fileContent = event.target.result;

        // Upload the file to S3 using Axios
        await axios.put(signedUrl, fileContent, {
          headers: {
            "Content-Type": file.type,
          },
        });

        resolve(`forms/${fileName}`);
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
      await updateAttachments(values);

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
      // window.location.reload();
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
  async function handleDelete() {
    try {
      setIsLoading(true);
      setDeleteConfirmOpen(false);
      await deleteForm();
      nav(`/workspace/${workspaceId}/register/${templateId}`);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function deleteForm() {
    return await makeApiCall(
      "DELETE",
      `/workspaces/${workspaceId}/forms/${formId}`
    );
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
    <WorkspaceInfoBox workspace={workspace} />
      <Header as="h2">
        {!formId
          ? "New Record"
          : isEditing
          ? "Edit"
          : isRevisioning
          ? "Revision"
          : ""}
      </Header>
      {workspaceId && templateId && formId && (
        <Popup
          content="Link to this record copied."
          on="click"
          trigger={
            <Label
              as="a"
              onClick={() => {
                navigator.clipboard.writeText(
                  `/workspace/${workspaceId}/form/${templateId}/${formId}`
                );
              }}
            >
              <Icon name="copy" />
              Link
            </Label>
          }
        />
      )}
      
      <div className="form-background">
      <GenericForm
        formDef={template.templateDefinition}
        formData={formRecord ? formRecord.formValues : null}
        handleSubmit={handleSubmit}
        handleCancel={isNew ? null : cancelEdit}
        disabled={!editable}
      />
      </div>

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
          <Button primary basic size="mini" onClick={() => handleEdit(true)}>
            Revision
          </Button>
          <Button secondary basic size="mini" onClick={() => handleEdit(false)}>
            Edit
          </Button>

          <Confirm
            size="mini"
            header="This will delete the record."
            open={deleteConfirmOpen}
            onCancel={() => setDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
          />
          {formId && (isAdmin || workspace?.role === "Owner") && (
            <Button
              floated="right"
              basic
              size="mini"
              color="red"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Icon name="remove circle" />
              Delete Record
            </Button>
          )}
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
