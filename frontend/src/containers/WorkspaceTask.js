import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  Confirm,
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Label,
  Loader,
  Segment,
  Select,
} from "semantic-ui-react";
import UserPicker from "../components/UserPicker";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import {
  dateFromEpoch,
  dateToEpoch,
  normaliseCognitoUsers,
} from "../lib/helpers";
import "./WorkspaceTask.css";
import * as Yup from "yup";

export default function WorkspaceTask() {
  const NCR_WORKSPACE_ID = "NCR";

  const [isLoading, setIsLoading] = useState(true);
  const [isRecurringMode, setIsRecurringMode] = useState(false);
  const { workspaceId, taskId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [task, setTask] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

  let shape = {
    taskName: Yup.string().required("Task name is required"),
    };
  if (isRecurringMode) {
    shape.endDate = Yup.number()
        .nullable()
        .min(Yup.ref("startDate"), "End date must be greater than start date")
  }
  const Schema = Yup.object().shape(shape);
  const nav = useNavigate();

  const isNCR = () => workspaceId === NCR_WORKSPACE_ID;
  const canManageTeam = () => workspace && workspace.role === "Owner";
  const canManageRecurringTasks = () => workspace && workspace.role === "Owner";

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
      return await makeApiCall(
        "GET",
        `/workspaces/${workspaceId}/tasks/${taskId}`
      );
    }
    async function loadWorkspaceMembers() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/members`);
    }
    async function loadUsers() {
      return await makeApiCall("GET", `/users`);
    }

    async function onLoad() {
      try {
        const [members, usersData] = await Promise.all([
          loadWorkspaceMembers(),
          loadUsers(),
        ]);
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
          setIsRecurringMode(taskData.isRecurring === "Y");
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function createTask(item) {
    const endpoint = `/workspaces/${workspaceId}/${
      isRecurringMode ? "recurring-tasks" : "tasks"
    }`;
    return await makeApiCall("POST", endpoint, item);
  }
  async function updateTask(item) {
    const endpoint = `/workspaces/${workspaceId}/${
      isRecurringMode ? "recurring-tasks" : "tasks"
    }/${taskId}`;
    return await makeApiCall("PUT", endpoint, item);
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
      nav(-1);
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
    {
      key: "risk management",
      value: "Risk Management",
      text: "Risk Management",
    },
    {
      key: "client management",
      value: "Client Management",
      text: "Client Management",
    },
    { key: "operatoin", value: "Operation", text: "Operation" },
    { key: "quality assurance", value: "Quality Assurance", text: "Quality Assurance" },
    { key: "asset management", value: "Asset Management", text: "Asset Management" },
  ];

  const defaultValues = {
    userId: null,
    taskName: "",
    note: "",
    startDate: undefined,
    endDate: undefined,
    dueDate: undefined,
    completionDate: undefined,
    taskCode: "",
    taskType: "",
    correctiveAction: "",
    rootCause: "",
    taskStatus: "",
    frequency: "Daily"
  };
  const recurrenceOptions = [
    { key: "daily", value: "Daily", text: "Daily" },
    { key: "weekly", value: "Weekly", text: "Weekly" },
    { key: "fortnightly", value: "Fortnightly", text: "Fortnightly" },
    { key: "monthly", value: "Monthly", text: "Monthly" },
    { key: "three-monthly", value: "ThreeMonthly", text: "Every 3 Months" },
    { key: "six-monthly", value: "SixMonthly", text: "Every 6 Months" },
    { key: "yearly", value: "Yearly", text: "Yearly" },
  ];

  const renderTaskForm = () => {
    const color = isNCR() ? "red" : "blue";
    const iconName = isNCR() ? "target" : "keyboard outline";
    return (
      <>
        <Header as="h2" textAlign="center">
          <Icon.Group>
            <Icon name={iconName} color={color} />
            <Icon
              corner={isRecurringMode ? "top left" : "bottom right"}
              name={isRecurringMode ? "repeat" : "box"}
              color={color}
            />
          </Icon.Group>
          {isNCR()
            ? "Non-Compliance Report"
            : isRecurringMode
            ? "Recurring Task"
            : "Task"}
        </Header>
        <Formik
          initialValues={task || defaultValues}
          validate={validateForm}
          onSubmit={handleSubmit}
          validationSchema={Schema}
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
            let startDate = dateFromEpoch(values["startDate"]);
            let dueDate = dateFromEpoch(values["dueDate"]);
            let endDate = dateFromEpoch(values["endDate"]);
            let completionDate = dateFromEpoch(values["completionDate"]);

            return (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment textAlign="left">
                  {errors.taskName && touched.taskName && (
                    <Label pointing="below" color="orange">
                      {errors.taskName}
                    </Label>
                  )}
                   <Form.Field required >
                      <label>Title</label>
                      <Form.Input
                        name="taskName"
                        value={values.taskName}
                        onChange={handleChange}
                      />
                    </Form.Field>
                  <Form.Group widths="equal">
                   
                    <Form.Field>
                      <label>Code</label>
                      <Form.Input
                        name="taskCode"
                        value={values.taskCode}
                        onChange={handleChange}
                      />
                    </Form.Field><Form.Field>
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
                    {canManageTeam() && (
                      <p className="mini-text">
                        <span>Cannot find the user you are looking for? </span>
                        <a href={`/workspace/${workspaceId}/team`}>
                          Manage Team Members
                        </a>
                      </p>
                    )}
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

                  {canManageRecurringTasks() && 
                  !isNCR() && // NCRs cannot be recurring
                  !task && ( // cannot toggle an existing task between recurring and non-recurring
                    <>
                      <Checkbox
                        toggle
                        label="Recurring Task?"
                        onChange={(e, data) => {
                          setIsRecurringMode(data.checked);
                        }}
                        checked={isRecurringMode}
                      />
                      <Divider hidden />
                    </>
                  )}
                  {isRecurringMode && (<>
                    <Form.Group>
                      <Form.Field>
                        <label>Frequency</label>
                        <Select
                          onChange={(e, { name, value }) =>
                            setFieldValue(name, value)
                          }
                          placeholder="Select"
                          options={recurrenceOptions}
                          name="frequency"
                          value={values.frequency}
                        />
                      </Form.Field>
                      <Form.Field>
                        <label>Start</label>
                        <DatePicker
                          placeholderText="Select"
                          isClearable="true"
                          name="startDate"
                          dateFormat="dd-MMM-yy"
                          selected={startDate}
                          onChange={(date) => {
                            setFieldValue("startDate", dateToEpoch(date));
                          }}
                          className="form-field"
                        />
                      </Form.Field>
                      <Form.Field>
                        <label>End</label>

                        <DatePicker
                          placeholderText="Select"
                          isClearable={true}
                          name="endDate"
                          dateFormat="dd-MMM-yy"
                          selected={endDate}
                          onChange={(date) => {
                            setFieldValue("endDate", dateToEpoch(date));
                          }}
                          className="form-field"
                        />
                      </Form.Field>
                    </Form.Group>
                    {errors.startDate && touched.startDate && (
                        <Label pointing="right" color="orange">
                          {errors.startDate}
                        </Label>
                      )}
                    {errors.endDate && touched.endDate && (
                        <Label pointing="right" color="orange">
                          {errors.endDate}
                        </Label>
                      )}

                    </>
                  )}

                  {!isRecurringMode && (
                    <>
                      {errors.startDate && touched.startDate && (
                        <Label pointing="below" color="orange">
                          {errors.startDate}
                        </Label>
                      )}

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
                              setFieldValue("startDate", dateToEpoch(date))
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
                              setFieldValue("dueDate", dateToEpoch(date))
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
                              setFieldValue("completionDate", dateToEpoch(date))
                            }
                            className="form-field"
                          />
                        </Form.Field>
                      </Form.Group>
                    </>
                  )}
                  {isNCR() && (
                    <>
                      <Divider />
                      <Form.Field>
                        <label>Corrective Action</label>
                        <Form.Input
                          name="correctiveAction"
                          value={values.correctiveAction}
                          onChange={handleChange}
                        />
                      </Form.Field>
                      <Form.Field>
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
                  style={{ marginTop: "40px" }}
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
      <>
        <WorkspaceInfoBox workspace={workspace} />

        <Grid textAlign="center" verticalAlign="middle">
          <Grid.Column style={{ maxWidth: 650 }}>
            {renderTaskForm()}
            {canDelete() && taskId && (
              <>
                <Divider hidden />
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
