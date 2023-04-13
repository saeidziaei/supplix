import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { onError } from "../lib/errorLib";
import config from "../config";
import { makeApiCall } from "../lib/apiLib";
import axios from "axios";
import { Form, Header, Input, Label, Loader, Segment, Grid, Message, Icon, Button, Image, Card } from "semantic-ui-react";
import { Formik } from "formik";
import placeholderImage from './fileplaceholder.jpg'
import { LinkContainer } from "react-router-bootstrap";
import { useAppContext } from "../lib/contextLib";


export default function Doc() {
  const file = useRef(null);
  const { currentWorkspace, setCurrentWorkspace } = useAppContext();

  const { workspaceId, docId } = useParams();
  const [doc, setDoc] = useState(null); // Original before save
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadDoc() {
      return await makeApiCall("GET", `/docs/${docId}`);
    }

    async function onLoad() {
      try {
        if (docId) {
          const item = await loadDoc();

          setDoc(item);
        }
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

  async function handleSubmit(values, { setSubmitting }) {
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
      // other validatoins ... TODO
      const fileName = file.current.name;

      const signedUrl = await makeApiCall("POST", `/docs/upload-url`, {
        fileName: fileName,
        contentType: file.current.type,
      });

      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        const fileContent = event.target.result;
        console.log(fileContent, file.current.type);

        // Upload the file to S3 using Axios
        await axios.put(signedUrl, fileContent, {
          headers: {
            "Content-Type": file.current.type,
          },
        });

        await createDoc({
          fileName: fileName,
          category: values.category,
          note: values.note,
        });
        nav("/docs");

        setSubmitting(false);
      });

      reader.readAsArrayBuffer(file.current);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function createDoc(item) {
    return await makeApiCall("POST", "/docs", item);
  }
  function rednerUploadForm() {
    return (
      <Grid
        textAlign="center"
        style={{ height: "100vh" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" color="teal" textAlign="center">
            <Icon name="box" color="teal" /> Upload to library
          </Header>
          <Formik
            initialValues={{ category: "", note: "" }}
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
                  <Form.Input onChange={handleFileChange} type="file" />
                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="comment"
                    name="note"
                    placeholder="Note"
                    value={values.note}
                    onChange={handleChange}
                  />
                  <LinkContainer to={`/docs`}><Button>Back</Button></LinkContainer> 
                  <Button primary type="submit" disabled={isSubmitting}>
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

  function renderDoc() {
    return (
      <>
        <Grid 
          textAlign="center"
          style={{ height: "100vh" }}
          verticalAlign="middle"
        >
          <Grid.Column width="8" >
              

              <Image
                src={doc.fileURL}
                wrapped
                alt={doc.fileName}
                onError={(e) => {
                  e.target.src = placeholderImage;
                }}
              />
              <Header>{doc.note}</Header>
              <Label>{doc.category}</Label>
              <p><br/>
              <a href={doc.fileURL} download={doc.fileName}>Download {doc.fileName}</a>
              
              </p>
              
          </Grid.Column>
        </Grid>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  if (doc) return renderDoc();
  else return rednerUploadForm();
}
