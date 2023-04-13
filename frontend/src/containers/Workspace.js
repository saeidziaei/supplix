import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Form,
  Grid,
  Header,
  Icon, Loader,
  Segment
} from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";

export default function Workspace() {

  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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
        window.location.reload();
      } else {
        await createWorkspace(values);
        nav("/workspaces")
      }
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

  function renderWorkspace() {
    return (
      <Grid
        textAlign="center"
        style={{ height: "100vh" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" color="black" textAlign="center">
                                          <Icon.Group >
                                <Icon name="list alternate outline" />
                                <Icon corner name="clock outline" />
                              </Icon.Group> Workspace
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
              /* and other goodies */
            }) => (
              <Form onSubmit={handleSubmit} autoComplete="off">
                <Segment>
                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="tag"
                    name="workspaceName"
                    placeholder="Workspace Name"
                    value={values.workspaceName}
                    onChange={handleChange}
                  />

                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="compass outline"
                    name="category"
                    placeholder="Category"
                    value={values.category}
                    onChange={handleChange}
                  />

                  <Form.TextArea
                    name="note"
                    placeholder="Note"
                    value={values.note}
                    onChange={handleChange}
                  />

                  <Button color="black" type="submit" disabled={isSubmitting}>
                    Submit
                  </Button>
                </Segment>
              </Form>
            )}
          </Formik>
        </Grid.Column>
      </Grid>
    );
  }

  if (isLoading) return <Loader active />;

  return renderWorkspace();
}
