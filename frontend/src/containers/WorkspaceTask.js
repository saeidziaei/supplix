import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Divider,
  Loader,
  Segment,
  Tab,
  Form,
  Modal,
  Select,
  Label,
  Grid,
  Confirm,
  Icon,
  Header,
} from "semantic-ui-react";
import UserPicker from "../components/UserPicker";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { normaliseCognitoUsers, parseDate } from "../lib/helpers";
import "./WorkspaceTask.css";
import { Formik } from "formik";
import WorkspacePicker from "../components/WorkspacePicker";
import DatePicker from "react-datepicker";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useAppContext } from "../lib/contextLib";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";

export default function WorkspaceTask() {
  const NCR_WORKSPACE_ID = "NCR";  

  const [isLoading, setIsLoading] = useState(true);
  const { workspaceId, taskId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  const canDelete = () => isAdmin;

  const nav = useNavigate();

  function validateForm() {
    return true; // file.current
  }
  useEffect(() => {
    async function loadUsers() {
      return await makeApiCall("GET", `/users`);
    }
    async function loadTask() {
      if (!taskId) {
        // just return workspace
        const ret = await makeApiCall("GET", `/workspaces/${workspaceId}`);
        return { workspace: ret.workspace };
      }

      return await makeApiCall(
        "GET",
        `/workspaces/${workspaceId}/tasks/${taskId}`
      );
    }

    async function onLoad() {
      try {
        const [users, task] = await Promise.all([loadUsers(), loadTask()]);
        // workspaceId in the path therefore results are in data element and it also returns workspace
        const { data, workspace } = task ?? {};

        setTask(data);
        setWorkspace(workspace);
        setUsers(normaliseCognitoUsers(users));
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  const panes = [
    {
      menuItem: "Task",
      render: () => <Tab.Pane attached={false}>{renderTaskForm()}</Tab.Pane>,
    },
    {
      menuItem: "Recurring",
      render: () => (
        <Tab.Pane attached={false}>{renerRecurringTaskForm()}</Tab.Pane>
      ),
    },
  ];
  async function createTask(item) {
    return await makeApiCall("POST", `/workspaces/${workspaceId}/tasks`, item);
  }
  async function updateTask(item) {
    return await makeApiCall(
      "PUT",
      `/workspaces/${workspaceId}/tasks/${taskId}`,
      item
    );
  }
  async function deleteTask() {
    return await makeApiCall(
      "DELETE",
      `/workspaces/${workspaceId}/tasks/${taskId}`
    );
  }

  async function handleSubmit(values, { setSubmitting }) {
    setIsLoading(true);

    try {
      if (taskId) {
        await updateTask(values);
      } else {
        await createTask(values);
      }
      nav("/");
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  const statusOptions = [
    { key: "inProgress", value: "In Progress", text: "In Progress" },
    { key: "onHold", value: "On Hold", text: "On Hold" },
    { key: "cancelled", value: "Cancelled", text: "Cancelled" },
    { key: "completed", value: "Completed", text: "Completed" },
  ];

  const renerRecurringTaskForm = () => "todo";
  const renderTaskForm = () => {
    return (
      <>
        <Header as="h2" textAlign="center">
          <Icon.Group>
            <Icon name="keyboard outline" color="blue" />
            <Icon corner name="clock outline" color="blue" />
          </Icon.Group>
          Task
        </Header>
        <Formik
          initialValues={{ ...task }}
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
          }) => {
            let startDate = parseDate(values["startDate"]);
            let dueDate = parseDate(values["dueDate"]);

            return (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment textAlign="left">
                  <Form.Group>
                    <Form.Field required width={12}>
                      <label>Task Name</label>
                      <Form.Input
                        name="taskName"
                        value={values.taskName}
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
                        name="taskStatus"
                        value={values.taskStatus}
                      />
                    </Form.Field>
                  </Form.Group>

                  <Form.Field>
                    <UserPicker
                      users={users}
                      value={values.userId}
                      onChange={(userId) => setFieldValue("userId", userId)}
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
                      <label>Due</label>
                      <DatePicker
                        placeholderText="Select"
                        isClearable="true"
                        name="dueDate"
                        dateFormat="dd-MMM-yy"
                        selected={dueDate}
                        onChange={(date) =>
                          setFieldValue(
                            "dueDate",
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
                </Segment>
                <Button
                  style={{ marginTop: "20px" }}
                  basic
                  primary
                  type="submit"
                  disabled={isSubmitting}
                  floated="right"
                >
                  Save
                </Button>
              </Form>
            );
          }}
        </Formik>
        <Divider hidden />
      </>
    );
  };
  const render = () => {
    return (
      // <Tab
      //   menu={{ color: "blue", inverted: true, attached: false, tabular: false }}
      //   panes={panes}
      // />
      <>
      <WorkspaceInfoBox workspace={workspace} />
      <Grid textAlign="center" verticalAlign="middle">
        <Grid.Column style={{ maxWidth: 550 }}>
        
          {renderTaskForm()}
          {canDelete && taskId && (
            <>
              <Divider />
              <Confirm
                size="mini"
                header="This will delete the task."
                open={deleteConfirmOpen}
                onCancel={() => setDeleteConfirmOpen(false)}
                onConfirm={async () => {
                  setIsLoading(true);
                  await deleteTask();
                  nav("/");
                }}
              />
              <Button
                size="mini"
                color="red"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Icon name="remove circle" />
                Delete Task
              </Button>
            </>
          )}
        </Grid.Column>
      </Grid>
      </>
    );
  };

  if (isLoading) return <Loader active />;

  return render();
}
