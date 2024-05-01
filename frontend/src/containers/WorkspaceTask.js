import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
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
  Loader,
  Segment
} from "semantic-ui-react";
import * as Yup from "yup";
import DateInput from "../components/DateInput";
import SelectInput from "../components/SelectInput";
import TextInput from "../components/TextInput";
import UserPicker from "../components/UserPicker";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import {
  dateFromEpoch,
  dateToEpoch,
} from "../lib/helpers";

export default function WorkspaceTask() {
  const NCR_WORKSPACE_ID = "NCR";

  const [isLoading, setIsLoading] = useState(true);
  const [isRecurringMode, setIsRecurringMode] = useState(false);
  const { workspaceId, taskId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [task, setTask] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { currentUserRoles, tenant, users } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");
  

  const getNCRTitle = () => (tenant && tenant.NCRLabel) ? tenant.NCRLabel : "Non-Compliant Report";
  
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
  const canManageTeam = () => !isNCR() && workspace && workspace.role === "Owner";
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
 

    async function onLoad() {
      try {
        const members = await loadWorkspaceMembers()
        

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
            ? getNCRTitle()
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
                  <div className="w-full grid grid-cols-6 gap-4">
                    <div className="col-span-6 px-0 md:px-3">
                      <TextInput
                        label="Title"
                        isMandatory={true}
                        name="taskName"
                        value={values.taskName}
                        onChange={handleChange}
                        error={
                          errors.taskName &&
                          touched.taskName && { message: errors.taskName }
                        }
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                      <TextInput
                        label="Code"
                        name="taskCode"
                        value={values.taskCode}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                      <SelectInput
                        label="Type"
                        onChange={(e, { name, value }) =>
                          setFieldValue(name, value)
                        }
                        options={typeOptions}
                        name="taskType"
                        value={values.taskType}
                      />
                    </div>

                    <div className="col-span-6 px-0 md:px-3">
                      <UserPicker
                        label="Assignee"
                        users={memberUsers}
                        value={values.userId}
                        onChange={(userId) => setFieldValue("userId", userId)}
                      />
                      {canManageTeam() && (
                        <p className="mini-text">
                          <span>
                            Cannot find the user you are looking for?{" "}
                          </span>
                          <a href={`/workspace/${workspaceId}/team`}>
                            Manage Team Members
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="col-span-6 px-0 md:px-3">
                      <label className="w-full  flex flex-row items-center justify-start">
                        Description
                      </label>
                      <CKEditor
                        placeholder="Description"
                        editor={ClassicEditor}
                        data={values.note}
                        onChange={(event, editor) => {
                          const data = editor.getData();
                          setFieldValue("note", data);
                        }}
                      />
                    </div>
                    <div className="col-span-6 px-0 md:px-3">
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
                    </div>

                    {isRecurringMode && (
                      <>
                        <div className="col-span-6 md:col-span-2 px-0 md:px-3">
                          <SelectInput
                            label="Frequency"
                            onChange={(e, { name, value }) =>
                              setFieldValue(name, value)
                            }
                            options={recurrenceOptions}
                            name="frequency"
                            value={values.frequency}
                          />
                        </div>

                        <div className="col-span-6 md:col-span-2 px-0 md:px-3">
                          <DateInput
                            label="Start"
                            name="startDate"
                            value={startDate}
                            onChange={(date) => {
                              setFieldValue("startDate", dateToEpoch(date));
                            }}
                            error={
                              errors.startDate &&
                              touched.startDate && { message: errors.startDate }
                            }
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2 px-0 md:px-3">
                          <DateInput
                            label="End"
                            name="endDate"
                            value={endDate}
                            onChange={(date) => {
                              setFieldValue("endDate", dateToEpoch(date));
                            }}
                            error={
                              errors.endDate &&
                              touched.endDate && { message: errors.endDate }
                            }
                          />
                        </div>
                      </>
                    )}

                    {!isRecurringMode && (
                      <>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                          <DateInput
                            label="Start"
                            name="startDate"
                            value={startDate}
                            onChange={(date) => {
                              setFieldValue("startDate", dateToEpoch(date));
                            }}
                            error={
                              errors.startDate &&
                              touched.startDate && { message: errors.startDate }
                            }
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                          <DateInput
                            label="Due"
                            name="dueDate"
                            value={dueDate}
                            onChange={(date) => {
                              setFieldValue("dueDate", dateToEpoch(date));
                            }}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                          <SelectInput
                            label="Status"
                            onChange={(e, { name, value }) =>
                              setFieldValue(name, value)
                            }
                            options={statusOptions}
                            name="taskStatus"
                            value={values.taskStatus}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                          <DateInput
                            label="Completion"
                            name="completionDate"
                            value={completionDate}
                            onChange={(date) => {
                              setFieldValue(
                                "completionDate",
                                dateToEpoch(date)
                              );
                            }}
                          />
                        </div>
                      </>
                    )}
                    {isNCR() && (
                      <>
                        <div className="col-span-6  px-0 md:px-3"><Divider /></div>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                        
                          <TextInput
                            label="Corrective Action"
                            name="correctiveAction"
                            value={values.correctiveAction}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 px-0 md:px-3">
                          <TextInput
                            label="Root Cause"
                            name="rootCause"
                            value={values.rootCause}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Segment>

                <Button
                  className={`px-3 md:px-0 w-[96%] md:w-full m-auto !mt-4 !bg-gradient-to-tr ${
                    isNCR()
                      ? "!from-red-400 !to-red-700"
                      : "!from-blue-500 !to-blue-400"
                  }  !shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] !text-white !rounded-xl hover:!text-gray-300 transition duration-300`}
                  disabled={isSubmitting}
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
        {!isNCR() && <WorkspaceInfoBox workspace={workspace} leafFolder="Tasks" />}

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
