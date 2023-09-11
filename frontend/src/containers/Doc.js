import axios from "axios";
import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Confirm, Divider, Form, Grid, Header, Icon, Image, Label, List, Loader, Segment } from "semantic-ui-react";
import config from "../config";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import placeholderImage from '../fileplaceholder.jpg';
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";



export default function Doc() {
  const { workspaceId, docId } = useParams();

  const file = useRef(null);
  const [doc, setDoc] = useState(null); // Original before save
  const [workspace, setWorkspace] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { currentUserRoles } = useAppContext();

  const isAdmin = currentUserRoles.includes("admins");


  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadDoc() {
      if (!docId) {
        // just return workspace
        const ret = await makeApiCall("GET", `/workspaces/${workspaceId}`);
        return { workspace: ret.workspace };
      }

      return await makeApiCall("GET", `/workspaces/${workspaceId}/docs/${docId}`);
    }

    async function onLoad() {
      try {
        const doc = await loadDoc();
        // loadDoc has workspaceId in the path therefore items are in data element and it also returns workspace
        const { data, workspace } = doc ?? {};

        setWorkspace(workspace);
        setDoc(data);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }
  async function handleDelete() {
    try {
      setIsLoading(true);
      setDeleteConfirmOpen(false);
      await deleteDoc();
      nav(`/workspace/${workspaceId}/docs`);
    } catch (e) {
      onError(e);
    }

    setIsLoading(false);
  }
  async function deleteDoc() {
    return await makeApiCall(
      "DELETE",
      `/workspaces/${workspaceId}/docs/${docId}`
    );
  }

  async function handleSubmit(values, { setSubmitting }) {
    if (isEditing) {
      try {
        setIsLoading(true);
        await updateDoc(values);
        nav(`/workspace/${workspaceId}/docs`);
      } catch (e) {
        onError(e);
      }
      setIsLoading(false);
      return;
    }

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }
    setIsLoading(true);

    try {
      const folder = "docs";
      // other validatoins ... TODO
      const fileName = file.current.name;

      const signedUrl = await makeApiCall("POST", `/docs/upload-url`, {
        fileName: fileName,
        folder: folder,
        contentType: file.current.type,
      });

      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        const fileContent = event.target.result;

        // Upload the file to S3 using Axios
        await axios.put(signedUrl, fileContent, {
          headers: {
            "Content-Type": file.current.type,
          },
        });

        await createDoc({
          fileName: `${folder}/${fileName}`,
          category: values.category,
          note: values.note,
        });
        nav(`/workspace/${workspaceId}/docs`);

        setSubmitting(false);
      });

      reader.readAsArrayBuffer(file.current);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function createDoc(item) {
    return await makeApiCall("POST", `/workspaces/${workspaceId}/docs`, item);
  }
  async function updateDoc(item) {
    return await makeApiCall("PUT", `/workspaces/${workspaceId}/docs/${doc.docId}`, { category: item.category, note: item.note });
  }
  function renderForm() {
    return (
      <Grid textAlign="center" style={{ height: "100vh" }}>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" color="black" textAlign="center">
            <Icon name="box" color="grey" />
            {isEditing ? "Edit" : "Upload to library"}
          </Header>
          <Formik
            initialValues={doc || { category: "", note: "" }}
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
              <Form onSubmit={handleSubmit}>
                <Segment>
                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="tag"
                    name="category"
                    placeholder="Category"
                    value={values.category}
                    onChange={handleChange}
                  />
                  {!isEditing && (
                    <Form.Input onChange={handleFileChange} type="file" />
                  )}
                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="comment"
                    name="note"
                    placeholder="Note"
                    value={values.note}
                    onChange={handleChange}
                  />
                </Segment>
                {isEditing ? (
                  <Button
                    basic
                    floated="left"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <LinkContainer to={`/workspace/${workspaceId}/docs`}>
                    <Button basic floated="left">
                      Back
                    </Button>
                  </LinkContainer>
                )}
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
            )}
          </Formik>
        </Grid.Column>
      </Grid>
    );
  }

  function renderDoc() {
    return (
      <>
        <Grid textAlign="center" style={{ height: "100vh" }} columns="1">
          <Grid.Column>
            <Image
              src={doc.fileURL}
              wrapped
              alt={doc.fileName}
              onError={(e) => {
                e.target.src = placeholderImage;
              }}
            />
            <Divider hidden />
            {isEditing ? (
              renderForm()
            ) : (
              <List horizontal>
                <List.Item>
                  <Label>{doc.category}</Label>
                </List.Item>
                <List.Item>
                  <Header>{doc.note}</Header>
                </List.Item>
                <List.Item>
                  <Button
                    circular
                    basic
                    size="tiny"
                    icon="edit"
                    floated="left"
                    onClick={() => setIsEditing(true)}
                  />
                </List.Item>
                <List.Item></List.Item>
              </List>
            )}
            <p>
              <br />
              <a href={doc.fileURL} download={doc.fileName}>
                Download {doc.fileName}
              </a>
            </p>

            <Divider />
            <Confirm
              size="mini"
              header="This will delete this library item."
              open={deleteConfirmOpen}
              onCancel={() => setDeleteConfirmOpen(false)}
              onConfirm={handleDelete}
            />
            {docId && (isAdmin || workspace?.role === "Owner") && (
              <Button
                size="mini"
                color="red"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Icon name="remove circle" />
                Delete
              </Button>
            )}
          </Grid.Column>
        </Grid>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  return (
    <>
      <WorkspaceInfoBox workspace={workspace} />
      {doc ? renderDoc() : renderForm()}
    </>
  );
}
