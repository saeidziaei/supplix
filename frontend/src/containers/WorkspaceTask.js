import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
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
  Icon,
  Loader,
  Segment,
  Select,
  Tab
} from "semantic-ui-react";
import UserPicker from "../components/UserPicker";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { normaliseCognitoUsers, parseDate } from "../lib/helpers";
import "./WorkspaceTask.css";

export default function WorkspaceTask() {
  const NCR_WORKSPACE_ID = "NCR";  

  const [isLoading, setIsLoading] = useState(true);
  const { workspaceId, taskId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [task, setTask] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");


  const nav = useNavigate();

  const isNCR = () => workspaceId === NCR_WORKSPACE_ID;
  const canDelete = () => {
    if (isNCR()) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    if (workspace && workspace.role === "Owner") {
      return true;
    }

    return false;
  };
  
  function validateForm() {
    return true; // file.current
  }
  useEffect(() => {

    async function loadTask() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/tasks/${taskId}`);
    }
    async function loadWorkspaceMembers() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/members`);
    }
    async function loadUsers() {
      return await makeApiCall("GET", `/users`); 
    }

    async function onLoad() {
      try {
        const [members, usersData] = await Promise.all([loadWorkspaceMembers(), loadUsers()]);
        const users = normaliseCognitoUsers(usersData);

        // workspaceId in the path therefore results are in data element and it also returns workspace
        const { data: membersData, workspace } = members ?? {};
        setWorkspace(workspace);

        if (isNCR()) {
          setMemberUsers(users); // include everyone
        } else {
          // only include team members
          if (!membersData || membersData.length === 0) {
            setMemberUsers([]);
          } else {
            const memberUsers = users.filter((user) =>
              membersData.some((member) => member.userId === user.Username)
            );
            setMemberUsers(memberUsers);
          }
        }

        if (taskId) {
          const task = await loadTask();
          const { data: taskData } = task ?? {};
          setTask(taskData);
        }
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
  async function handleDelete() {
    try {
      setDeleteConfirmOpen(false);
      setIsLoading(true);
      await deleteTask();
      nav(`/workspace/${workspaceId}/tasks`);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }

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
  const typeOptions = [
    { key: "risk management", value: "Risk Management", text: "Risk Management" },
    { key: "client management", value: "Client Management", text: "Client Management" },
    { key: "operatoin", value: "Operation", text: "Operation" },
  ];

  const renerRecurringTaskForm = () => "todo";
  const defaultValues = {
    userId: null, 
    taskName: "",
    note: "",
    startDate: "",
    dueDate: "",
    completionDate: "",
    taskCode: "",
    taskType: "",
    correctiveAction: "", 
    rootCause: "", 
    taskStatus: "",
  }
  const renderTaskForm = () => {
    return (
      <>
        <Header as="h2" textAlign="center">
          <Icon.Group>
            <Icon name="keyboard outline" color="blue" />
            <Icon corner name="clock outline" color="blue" />
          </Icon.Group>
          {isNCR() ? "NCR Item" : "Task"}
        </Header>
        <Formik
          initialValues={task || defaultValues}
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
            let completionDate = parseDate(values["completionDate"]);

            return (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment textAlign="left">
                  <Form.Group>
                    <Form.Field required width={12}>
                      <label>Title</label>
                      <Form.Input
                        name="taskName"
                        value={values.taskName}
                        onChange={handleChange}
                      />
                    </Form.Field>
                    <Form.Field>
                      <label>Type</label>
                      <Select
                        onChange={(e, { name, value }) =>
                          setFieldValue(name, value)
                        }
                        placeholder="Select"
                        clearable
                        options={typeOptions}
                        name="taskType"
                        value={values.taskType}
                      />
                    </Form.Field>
                  </Form.Group>

                  <Form.Field>
                    <span>Assignee </span>
                    <UserPicker
                      users={memberUsers}
                      value={values.userId}
                      onChange={(userId) => setFieldValue("userId", userId)}
                    />
                  </Form.Field>
                  <Form.Field>
                    <label>Description</label>

                    <CKEditor
                      placeholder="Description"
                      editor={ClassicEditor}
                      data={values.note}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFieldValue("note", data);
                      }}
                    />
                  </Form.Field>
                  <Divider />
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
                  <Form.Group widths="equal">
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
                    <Form.Field>
                      <label>Completion</label>
                      <DatePicker
                        placeholderText="Select"
                        isClearable="true"
                        name="completionDate"
                        dateFormat="dd-MMM-yy"
                        selected={completionDate}
                        onChange={(date) =>
                          setFieldValue(
                            "completionDate",
                            date ? date.toISOString() : ""
                          )
                        }
                        className="form-field"
                      />
                    </Form.Field>
                  </Form.Group>
                  {isNCR() && (
                    <>
                    <Divider />
                      <Form.Field  >
                        <label>Corrective Action</label>
                        <Form.Input
                          name="correctiveAction"
                          value={values.correctiveAction}
                          onChange={handleChange}
                        />
                      </Form.Field>
                      <Form.Field  >
                        <label>Root Cause</label>
                        <Form.Input
                          name="rootCause"
                          value={values.rootCause}
                          onChange={handleChange}
                        />
                      </Form.Field>
                    </>
                  )}
                </Segment>
                <Button
                  style={{ marginTop: "20px" }}
                  basic
                  size="small"
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
          <Grid.Column style={{ maxWidth: 650 }}>
            {renderTaskForm()}
            {canDelete() && taskId && (
              <>
                <Divider />
                <Confirm
                  size="mini"
                  header="This will delete the task."
                  open={deleteConfirmOpen}
                  onCancel={() => setDeleteConfirmOpen(false)}
                  onConfirm={handleDelete}
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
