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
import FooterButtons from "../components/FooterButtons";
import pdf from "../pdf.svg"
import TextInput from "../components/TextInput";


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
      <Grid textAlign="center" verticalAlign="middle" className="!mt-10">
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
                <>
                  <TextInput
                  
                    value={values.category}
                    name="category"
                    onChange={handleChange}
                    label="Category"
                  />

                  {!isEditing && (<div className="my-3">
                    <Form.Input  onChange={handleFileChange} type="file" /></div>
                  )}
                  <TextInput
                    value={values.note}
                    name="note"
                    onChange={handleChange}
                    label="Note"
                  />
                </>
                <FooterButtons
                  rightButton={{
                    label: "Save",
                    icon: "save",
                    color: "blue",
                    isSubmit: true,
                  }}
                  leftButton={
                    isEditing
                      ? {
                          label: "Cancel",
                          icon: "undo",
                          color: "gray",
                          onClick: () => setIsEditing(false),
                        }
                      : {
                          label: "Back",
                          icon: "arrow left",
                          color: "gray",
                          link: `/workspace/${workspaceId}/docs`,
                        }
                  }
                />
                
              </Form>
            )}
          </Formik>
        </Grid.Column>
      </Grid>
    );
  }
  function isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    const fileExtension = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
    return imageExtensions.includes(fileExtension);
  }
  function isPDF(fileName) {
    const fileExtension = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
    return fileExtension === ".pdf"
  }


  function renderDoc() {
    return (
      <>
        <div className="flex justify-center items-start h-screen mt-10">
          <div className="max-w-lg w-full">
            <div className="border rounded p-6 m-1 ">
            {isImageFile(doc.fileName) ?
            <img
              src={doc.fileURL}
              alt={doc.fileName}
              className="w-full"
              onError={(e) => {
                e.target.src = placeholderImage;
              }}
            /> : <img src={isPDF(doc.fileName) ? pdf : placeholderImage} className="w-[100px]" /> }
        <a
                href={doc.fileURL}
                download={doc.fileName}
                className="text-blue-500"
              >
                {doc.fileName}
              </a>
            <div className="mt-4 ">
              {isEditing ? (
                renderForm()
              ) : (
                <>
                
                  <div className="">
                    Category: {doc.category}
                  </div>
                  <div className="mt-5">Note: {doc.note}</div></>
              )}
              
            </div>
            </div>
            <div className="mt-4">
              
              {!isEditing &&
              <FooterButtons
                rightButton={{
                  label: "Edit",
                  icon: "pencil",
                  color: "teal",
                  onClick: () => setIsEditing(true),
                }}
                leftButton={docId && (isAdmin || workspace?.role === "Owner") && {
                  label: "Delete",
                  icon: "x",
                  color: "red",
                  onClick: () => setDeleteConfirmOpen(true),
                }}
              />}
            </div>
          </div>
        </div>
        <Confirm
          size="mini"
          header="This will delete this library item."
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      </>
    );
  }
  

  if (isLoading) return <Loader active />;

  return (
    <div className="mx-auto px-4 w-full  xl:w-2/3">
      <WorkspaceInfoBox workspace={workspace} leafFolder="Library" />
      {doc ? renderDoc() : renderForm()}
    </div>
  );
}
