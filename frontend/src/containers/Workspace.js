import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  Button,
  Confirm,
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Label, Loader,
  Menu,
  Modal,
  Segment,
  Select,
  Table
} from "semantic-ui-react";
import WorkspacePicker from "../components/WorkspacePicker";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { parseDate } from "../lib/helpers";
import "./Workspaces.css";

export default function Workspace() {
  const { currentUserRoles } = useAppContext();
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState({}); // this is a bit different to the rest of the app just because workspace needs to be a placeholder for parentId
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(null);
  const [pickedParent, setPickedParent] = useState(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryStringParentId = queryParams.get('parentWorkspaceId');

  const [selectedTemplateCategories, setSelectedTemplateCategories] = useState([]);
  const [templateCategories, setTemplateCategories] = useState([]);

  async function loadTemplates() {
    try {
      const response = await makeApiCall("GET", `/templates`);
      const uniqueCategoriesSet = new Set();
      response.forEach((t) => {
        const category = t.templateDefinition?.category;
        if (category) {
          uniqueCategoriesSet.add(category);
        }
      });

      const uniqueCategoriesArray = Array.from(uniqueCategoriesSet);
      setTemplateCategories(uniqueCategoriesArray);
    } catch (error) {
      onError(error);
    }
  }

  useEffect(() => {
    // Load templates on component mount
    loadTemplates();
  }, []);


  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadWorkspace() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}`);
    }    
    async function loadWorkspaces() {
      return await makeApiCall("GET", `/workspaces`);
    }

    async function onLoad() {
      try {

        let workspaceData = {};

        if (workspaceId) {
          const item = await loadWorkspace();// loadWorkspace has workspace in the path therefore it return workspace in a child element
          workspaceData = item.workspace ?? {};
          setSelectedTemplateCategories(workspaceData.templateCategories || []);
        }
    
        const list = await loadWorkspaces();
        setWorkspaces(list.filter((w) => w.workspaceId !== workspaceData.workspaceId)); // Fix the condition to avoid excluding the current workspace

        const parentId = workspaceData.parentId || queryStringParentId;
        workspaceData.parentId = parentId;
        workspaceData.parent = list.find((w) => w.workspaceId === parentId);
    
        setWorkspace(workspaceData);

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);


  async function handleSubmit(values, { setSubmitting }) {
    setIsLoading(true);
    values.parentId = workspace.parentId || null;
    values.templateCategories = selectedTemplateCategories;

    try {
      if (workspaceId) {
        await updateWorkspace(values);
      } else {
        await createWorkspace(values);
      }
      nav("/");

    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function createWorkspace(item) {
    return await makeApiCall("POST", "/workspaces", item);
  }
  async function updateWorkspace(item) {
    return await makeApiCall("PUT", `/workspaces/${workspaceId}`, item);
  }
  async function deleteWorkspace() {
    return await makeApiCall("DELETE", `/workspaces/${workspaceId}`);
  }



  const handleParentChange = () => {
    setWorkspace({...workspace, parentId: pickedParent ? pickedParent.workspaceId: null, parent: pickedParent});
  }
  const statusOptions = [
    { key: 'na', value: 'N/A', text: 'N/A' },
    { key: 'inProgress', value: 'In Progress', text: 'In Progress' },
    { key: 'onHold', value: 'On Hold', text: 'On Hold' },
    { key: 'cancelled', value: 'Cancelled', text: 'Cancelled' },
    { key: 'completed', value: 'Completed', text: 'Completed' },
  ];

  const templatesCheckboxes = !templateCategories ? null : (<><span className="mini-text">(Uncheck All to Include All Categories)</span>
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Category</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {templateCategories
  .map((templateCategory) => (
            <Table.Row key={templateCategory}>
              <Table.Cell>
                <Form.Checkbox
                  label={templateCategory}
                  value={templateCategory}
                  checked={selectedTemplateCategories.includes(templateCategory)}
                  onChange={() =>
                    handleTemplateCategoryCheckboxChange(templateCategory)
                  }
                />
              </Table.Cell>
              
            </Table.Row>
          ))}
      </Table.Body>
    </Table></>
  );
  function renderTemplatePicker() {
    return (
      <Accordion as={Menu} vertical fluid >
        <Menu.Item >
          <Accordion.Title 
            active={isTemplatePickerOpen}
            content="Applicable Forms"
            index={0}
            onClick={() => setIsTemplatePickerOpen(!isTemplatePickerOpen)}
          />
          <Accordion.Content
            active={isTemplatePickerOpen}
            content={templatesCheckboxes}
          />
        </Menu.Item>
      </Accordion>
    );
  }

  function handleTemplateCategoryCheckboxChange(templateCategory) {
    if (selectedTemplateCategories.includes(templateCategory)) {
      setSelectedTemplateCategories((prevIds) =>
        prevIds.filter((id) => id !== templateCategory)
      );
    } else {
      setSelectedTemplateCategories((prevIds) => [...prevIds, templateCategory]);
    }
  }


  function renderWorkspace() {
    const isAdmin = currentUserRoles.includes("admins");
    
    return (
      <Grid
        textAlign="center"
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 700 }}>
          <Header as="h2" textAlign="center">
            <Icon.Group>
              <Icon name="folder" color="yellow" />
              <Icon corner name="zip" color="yellow" />
            </Icon.Group>
            Workspace
          </Header>
          <Formik
            initialValues={{ ...workspace }}
            validate={validateForm}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleSubmit,
              isSubmitting,
              setFieldValue,
              /* and other goodies */
            }) => 
            {
              let endDate = parseDate(values["endDate"]);
              let startDate = parseDate(values["startDate"]);


            return (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment textAlign="left">
                  <Form.Group>
                    <Form.Field required width={12}>
                      <label>Workspace Name</label>
                      <Form.Input
                        name="workspaceName"
                        value={values.workspaceName}
                        onChange={handleChange}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Status</label>
                      <Select
                        onChange={(e, { name, value }) =>
                          setFieldValue(name, value)
                        }
                        placeholder="Select"
                        clearable
                        options={statusOptions}
                        name="workspaceStatus"
                        value={values.workspaceStatus}
                      />
                    </Form.Field>
                  </Form.Group>
                  <Divider hidden />
                  <Modal
                    onClose={() => setIsParentPickerOpen(false)}
                    onOpen={() => setIsParentPickerOpen(true)}
                    open={isParentPickerOpen}
                    trigger={
                      <Button
                        style={{ marginBottom: "20px" }}
                        color="yellow"
                        content="Parent Workspace"
                        icon="list"
                        label={{
                          basic: true,
                          color: "yellow",
                          pointing: "left",
                          content: `${
                            workspace && workspace.parent
                              ? workspace.parent.workspaceName
                              : "-"
                          }`,
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      />
                    }
                  >
                    <Modal.Header>Select Parent Workspace</Modal.Header>
                    <Modal.Content image>
                      <Modal.Description>
                        <WorkspacePicker
                          workspaces={workspaces}
                          allowNull={true}
                          onChange={(parent) => setPickedParent(parent)} // doesn't set the parent, just sets state
                          selectedWorkspaceId={
                            queryStringParentId || workspace.parentId
                          }
                        />
                      </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                      <Label>
                        Selected:{" "}
                        {pickedParent ? pickedParent.workspaceName : "(none)"}{" "}
                      </Label>
                      <Button
                        basic
                        circular
                        color="green"
                        size="tiny"
                        onClick={() => {
                          setIsParentPickerOpen(false);
                          handleParentChange();
                        }}
                        icon="check"
                      />
                      <Button
                        color="red"
                        size="tiny"
                        basic
                        circular
                        onClick={() => {
                          setIsParentPickerOpen(false);
                        }}
                        icon="x"
                      />
                    </Modal.Actions>
                  </Modal>

                  <Form.Group widths="equal">
                    <Form.Field>
                      <label>Category</label>
                      <Form.Input
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        placeholder="e.g. Management, Project, Tender"
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Code</label>
                      <Form.Input
                        name="workspaceCode"
                        value={values.workspaceCode}
                        onChange={handleChange}
                      />
                    </Form.Field>
                  </Form.Group>
                  <Form.Field>
                    <label>Client Name</label>
                    <Form.Input
                      name="clientName"
                      value={values.clientName}
                      onChange={handleChange}
                    />
                  </Form.Field>
                  <Form.Group widths="equal">
                    <Form.Field>
                      <label>Start</label>
                      <DatePicker
                        placeholderText="Select"
                        isClearable="true"
                        name="startDate"
                        dateFormat="dd-MMM-yy"
                        selected={startDate}
                        onChange={(date) =>
                          setFieldValue(
                            "startDate",
                            date ? date.toISOString() : ""
                          )
                        }
                        className="form-field"
                      />
                    </Form.Field>

                    <Form.Field>
                      <label>End</label>
                      <DatePicker
                        placeholderText="Select"
                        isClearable="true"
                        name="endDate"
                        dateFormat="dd-MMM-yy"
                        selected={endDate}
                        onChange={(date) =>
                          setFieldValue(
                            "endDate",
                            date ? date.toISOString() : ""
                          )
                        }
                        className="form-field"
                      />
                    </Form.Field>
                  </Form.Group>
                  <Form.Field>
                    <label>Note</label>

                    <CKEditor
                      editor={ClassicEditor}
                      data={values.note}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFieldValue("note", data);
                      }}
                    />
                  </Form.Field>
                  
          
          {renderTemplatePicker()}
        

                </Segment>

                <Button
                  basic
                  primary
                  type="submit"
                  disabled={isSubmitting}
                  floated="right"
                >
                  Save
                </Button>
              </Form>
            );}
          }
          </Formik>

          {isAdmin && workspaceId && (
            <>
              <Divider />
              <Confirm
                size="mini"
                header="This will delete the workspace and all documents and records associated with it."
                open={deleteConfirmOpen}
                onCancel={() => setDeleteConfirmOpen(false)}
                onConfirm={async () => {
                  setIsLoading(true);
                  await deleteWorkspace();
                  nav("/");
                }}
              />
              <Button
                size="mini"
                color="red"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Icon name="remove circle" />
                Delete Workspace
              </Button>
            </>
          )}
        </Grid.Column>
      </Grid>
    );
  }

  if (isLoading) return <Loader active />;

  return renderWorkspace();
}
