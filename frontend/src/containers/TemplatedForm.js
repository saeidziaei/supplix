import axios from "axios";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button,
  Confirm,
  Divider,
  Header,
  Icon,
  Label,
  Loader,
  Popup,
  Segment
} from "semantic-ui-react";
import { GenericForm } from "../components/GenericForm";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";
import "./TemplatedForm.css";
import { isSystemTemplate, loadSystemTemplate, templateEmployeeField } from "../lib/helpers";
import FooterButtons from "../components/FooterButtons";

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
  const [employeeFieldName, setEmployeeFieldName] = useState(null); 
  const { users } = useAppContext();
  const [memberUsers, setMemberUsers] = useState([]);

  const nav = useNavigate();
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");
  const isSystemForm = isSystemTemplate(templateId);

  async function loadForm() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/forms/${formId}`);
  }

  useEffect(() => {

    async function loadTemplate() {
      if (isSystemForm) {
        return loadSystemTemplate(templateId);
      }

      return await makeApiCall("GET", `/templates/${templateId}`);
    }
    async function loadWorkspaceMembers() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/members`);
    }

    async function onLoad() {
      try {
        setIsLoading(true);
        
        let template;

        const members = await loadWorkspaceMembers()
        const { data: membersData, workspace } = members ?? {};
        setWorkspace(workspace);
        if (!membersData || membersData.length === 0) {
          setMemberUsers([]);
        } else {
          const memberUsers = users.filter((user) =>
            membersData.some((member) => member.userId === user.Username)
          );
          setMemberUsers(memberUsers);
        }


        if (formId) {
          const item = await loadForm();
          const { data } = item ?? {};
          setFormRecord(data);
          
          if (isSystemForm) {
            template = loadSystemTemplate(templateId);
          } else {
            // the api populates template as well
            template = data.template;
          }
        } else {
          // new form - just load the template and workspace
          template = await loadTemplate();
        }
        setTemplate(template);
        
        const fieldName = templateEmployeeField(template?.templateDefinition);
        if (fieldName) { 
          setEmployeeFieldName(fieldName);
        }

        
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false);
      }
    }

    onLoad();
  }, [formId, users]);

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

        resolve(`forms/${encodeURIComponent(fileName)}`);
      });

      reader.readAsArrayBuffer(file);
    });
  }
  async function updateAttachments(values) {
    if (!values.attachments) return;

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
        // Fetch the updated form data after updating the form
        const updatedFormData = await loadForm(); 
        const { data } = updatedFormData ?? {};
        setFormRecord(data);
      } else {
        
        const ret = await createForm(values);
        setFormRecord(ret);
        newFormId = ret.formId;
        nav(`/workspace/${workspaceId}/form/${templateId}/${newFormId}`); 
      }

      
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setIsUploading(false);
      setIsRevisioning(false);
    }
  }
  async function createForm(values) {
    let item = {
      templateId: template.templateId,
      templateVersion: template.templateVersion,
      formValues: values,
    };
    if (employeeFieldName) { // the form is related to an employee
      item["userId"] = values[employeeFieldName];
    }
    return await makeApiCall("POST", `/workspaces/${workspaceId}/forms`, item);
  }

  async function updateForm(values) {
    let item = {
      formValues: values,
      isRevision: isSystemForm ? false : isRevisioning // this is bad, needs refactoring. For simplicity we just disable history on systemForms
    };
    if (employeeFieldName) { // the form is related to an employee
      item["userId"] = values[employeeFieldName];
    }

    return await makeApiCall("PUT", `/workspaces/${workspaceId}/forms/${formId}`, item);
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
  const renderActionInfo = (ts, userId) => {
    const date = new Date(ts);
    const user = users ? users.find(u => u.Username === userId) : {}; 
    
    return (ts ? date.toLocaleString() : "") + " by " + (user ? `${user.given_name} ${user.family_name}` : "");
  }

  if (isUploading) return <Loader active>Uploading attachments</Loader>;

  if (isLoading) return <Loader active />;

  if (!isSystemForm && (!template || !template.templateDefinition)) {
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
  
  const leafFolder = !formId
  ? "New Record"
  : isEditing
  ? "Edit"
  : isRevisioning
  ? "Revision"
  : "Record";

  return (
    <>
      <WorkspaceInfoBox workspace={workspace} leafFolder={leafFolder} />
      <div className="mx-auto  w-full lg:w-1/2 ">
      <GenericForm
        formDef={template.templateDefinition}
        formData={formRecord ? formRecord.formValues : null}
        handleSubmit={handleSubmit}
        handleCancel={isNew ? null : cancelEdit}
        disabled={!editable}
        users={users}
        members={memberUsers}
        isSystemForm={isSystemForm}
        systemFormName={templateId}
      />
      </div>

      {workspaceId && templateId && formId && (
        <Popup
          content="Link to this record copied."
          on="click"
          trigger={
            <Button
              circular
              size="tiny"
              icon="copy"
              onClick={() => {
                navigator.clipboard.writeText(
                  `/workspace/${workspaceId}/form/${templateId}/${formId}`
                );
              }}
            />
          }
        />
      )}
      {formRecord && (
        <p style={{ color: "#bbb" }}>
          Created {renderActionInfo(formRecord.createdAt, formRecord.createdBy)}{" "}
          <br />{" "}
          {formRecord.updatedAt
            ? "Last Edited " +
              renderActionInfo(formRecord.updatedAt, formRecord.updatedBy)
            : ""}
        </p>
      )}
      {!editable && (
        <>
          <FooterButtons
            leftButton={{
              label: "Edit",
              icon: "pencil",
              color: "teal",
              onClick: () => handleEdit(true),
            }}
            rightButton={
              formId &&
              (isAdmin || workspace?.role === "Owner") && {
                label: "Delete Record",
                icon: "remove circle",
                color: "red",
                onClick: () => setDeleteConfirmOpen(true),
              }
            }
          />
          <Confirm
            size="mini"
            header="This will delete the record."
            open={deleteConfirmOpen}
            onCancel={() => setDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
          />
        </>
      )}
      
      <Divider />
      <LinkContainer to={`/workspace/${workspaceId}/register/${templateId}`}>
        <Button className="hide-on-print" basic size="mini">
          All Records...
        </Button>
      </LinkContainer>

      {formRecord && formRecord.history && (
        <Accordion className="hide-on-print">
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
