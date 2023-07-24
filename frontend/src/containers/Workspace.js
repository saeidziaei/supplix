import { parseISO } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Confirm,
  Divider,
  Form,
  Grid,
  Header,
  Icon, Input, Loader,
  Segment,
  Select
} from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import "./Workspaces.css";

export default function Workspace() {
  const { currentUserRoles } = useAppContext();
  
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadWorkspace() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}`);
    }

    async function onLoad() {
      try {
        if (workspaceId) {
          const item = await loadWorkspace();

          setWorkspace(item);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function handleSubmit(values, { setSubmitting }) {
    setIsLoading(true);

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

  function parseDate(inputDate) {
    let selected = null;
    try {
      selected = parseISO(inputDate);
    } catch (e) {
      // incompatible data had been saved, just ignore it
    }
    if (selected == "Invalid Date") selected = ""; // new Date();

    return selected;
  }

  
  function renderWorkspace() {
    const isAdmin = currentUserRoles.includes("admins");
    

    return (
      <Grid
        textAlign="center"
        style={{ height: "100vh" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 550 }}>
          <Header as="h2" textAlign="center">
            <Icon.Group>
              <Icon name="folder" color="yellow" />
              <Icon corner name="zip" color="yellow" />
            </Icon.Group>{" "}
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
              const statusOptions = [
                { key: 'na', value: 'N/A', text: 'N/A' },
                { key: 'inProgress', value: 'In Progress', text: 'In Progress' },
                { key: 'onHold', value: 'On Hold', text: 'On Hold' },
                { key: 'cancelled', value: 'Cancelled', text: 'Cancelled' },
                { key: 'completed', value: 'Completed', text: 'Completed' },
              ];

            return (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment textAlign="left">
                <Form.Group >
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
                  </Form.Field></Form.Group>
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
                      <label>Sub Category</label>
                      <Form.Input
                        name="subCategory"
                        value={values.subCategory}
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
                    <Form.TextArea
                      name="note"
                      value={values.note}
                      onChange={handleChange}
                    />
                  </Form.Field>
                 

                  <Button type="submit" disabled={isSubmitting}>
                    Save
                  </Button>
                </Segment>
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
