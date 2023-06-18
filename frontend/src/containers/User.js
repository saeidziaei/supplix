import axios from "axios";
import { Field, Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Divider, Form, Grid, Header, Icon, Image, Label, Loader, Segment } from "semantic-ui-react";
import config from "../config";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import placeholderUserImage from '../placeholderUserImage.png';
import * as Yup from 'yup';

export default function User() {
  const { username, tenantId } = useParams();
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "", employeeNumber: "", password:"", isAdmin: false }); 
  const [isLoading, setIsLoading] = useState(true);
  const [changePhoto, setChangePhoto] = useState(false);
  const nav = useNavigate();
  const file = useRef(null);

  const Schema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string()
      .min(8, 'Password must be 8 characters long')
      .matches(/[0-9]/, 'Password requires a number')
      .matches(/[a-z]/, 'Password requires a lowercase letter')
      .matches(/[A-Z]/, 'Password requires an uppercase letter')
      .matches(/[^\w]/, 'Password requires a symbol'),
  });


  function handleFileChange(event) {
    file.current = event.target.files[0];
  }


  function getAttribute(user, attributeName) {
    const attribute = user.UserAttributes.find(
      (attr) => attr.Name === attributeName
    );
    if (attribute) {
      return attribute.Value;
    } else {
      return undefined;
    }
  }
  useEffect(() => {
    function loadUser() {
      if (tenantId)
        return makeApiCall("GET", `/tenants/${tenantId}/users/${username}`);
      else return makeApiCall("GET", `/users/${username}`);
    }

    async function onLoad() {
      try {
        if (username) {
          const item = await loadUser();
          
          setUser({
            firstName: getAttribute(item, "given_name") || "",
            lastName: getAttribute(item, "family_name") || "",
            phone: getAttribute(item, "phone_number") || "",
            email: getAttribute(item, "email") || "",
            ...item
            // isAdmin: item.isAdmin,
            // username: username
          });
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function validateForm() {
    return true; // file.current
  }

  async function handleSubmit(values) {
    if (changePhoto && file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }    
    setIsLoading(true);
    try {
      if (!changePhoto)
        return await handleSave(values);

      const folder = "employees";
      const fileName = `${Date.now()}-${file.current.name}`;

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

        values.photo = `${folder}/${fileName}`;
        values.oldPhoto = user ? user.photo : "";

        await handleSave(values);

      });

      reader.readAsArrayBuffer(file.current);

    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function handleSave(values) {
    if (username) {
      await updateUser(values);
      window.location.reload();
    } else {
      await createUser(values);
      if (tenantId)
        nav(`/tenants/${tenantId}/users`);
      else
        nav("/users");
    }
  }

  async function createUser(values) {
    if (tenantId)
      return await makeApiCall("POST", `/tenants/${tenantId}/users`, values);
    else return await makeApiCall("POST", `/users`, values);
  }

  function updateUser(values) {
    if (tenantId)
      return makeApiCall(
        "PUT",
        `/tenants/${tenantId}/users/${username}`,
        values
      );
    else return makeApiCall("PUT", `/users/${username}`, values);
  }

  if (isLoading) return <Loader active />;


  return (
    <Grid textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Formik
          initialValues={{ ...user }}
          validate={validateForm}
          validationSchema={Schema}
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
              <Header as="h2" textAlign="left">
                <Icon name="user outline" />
                {`${values.firstName} ${values.lastName}`}
              </Header>
              <Segment>
                {!tenantId && ( // do not upload photo for another tenant's employees as they get uploaded to current tenant folder
                  <>
                    {changePhoto && (
                      <>
                        <Form.Input onChange={handleFileChange} type="file" />{" "}
                        <Button
                          size="mini"
                          basic
                          onClick={() => setChangePhoto(false)}
                        >
                          <Icon name="undo" />
                        </Button>
                      </>
                    )}
                    {!changePhoto && (
                      <>
                        <Image
                          style={{
                            width: "200px",
                            height: "200px",
                            marginRight: "10px",
                          }}
                          rounded
                          src={values.photoURL || placeholderUserImage}
                          wrapped
                          alt={values.photo}
                          onError={(e) => {
                            e.target.src = placeholderUserImage;
                          }}
                        />
                        <Button
                          size="mini"
                          basic
                          onClick={() => setChangePhoto(true)}
                        >
                          Change Photo
                        </Button>
                      </>
                    )}
                  </>
                )}
                <Divider hidden />
                {errors.firstName && touched.firstName ? (
                  <Label pointing="below" color="orange">
                    {errors.firstName}
                  </Label>
                ) : null}
                <Form.Input
                  fluid
                  iconPosition="left"
                  icon="tag"
                  name="firstName"
                  placeholder="First Name"
                  value={values.firstName}
                  onChange={handleChange}
                />
                {errors.lastName && touched.lastName ? (
                  <Label pointing="below" color="orange">
                    {errors.lastName}
                  </Label>
                ) : null}
                <Form.Input
                  fluid
                  iconPosition="left"
                  icon="tag"
                  name="lastName"
                  placeholder="Last Name"
                  value={values.lastName}
                  onChange={handleChange}
                />
                <Form.Input
                  fluid
                  iconPosition="left"
                  icon="hashtag"
                  name="employeeNumber"
                  placeholder="EmployeeNumber"
                  value={values.employeeNumber}
                  onChange={handleChange}
                />
                {errors.email && touched.email ? (
                  <Label pointing="below" color="orange">
                    {errors.email}
                  </Label>
                ) : null}
                <Form.Input
                  fluid
                  iconPosition="left"
                  icon="mail"
                  name="email"
                  autoComplete="off"
                  placeholder="Email"
                  value={values.email}
                  onChange={handleChange}
                />
                {!username && (
                  <>
                    {errors.password && touched.password ? (
                      <Label pointing="below" color="orange">
                        {errors.password}
                      </Label>
                    ) : null}
                    <Form.Input
                      fluid
                      iconPosition="left"
                      icon="asterisk"
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={values.password}
                      onChange={handleChange}
                    />
                    <p style={{ textAlign: "left" }}>
                      <li>At least 8 characters</li>
                      <li>at least 1 number</li>
                      <li>at least 1 special character</li>
                      <li>at least 1 uppercase letter</li>
                      <li>at least 1 lowercase letter</li>
                    </p>
                  </>
                )}
                <Field
                  name="isAdmin"
                  render={({ field }) => (
                    <Checkbox
                      toggle
                      label="Is Admin?"
                      checked={field.value}
                      onChange={(e, { checked }) =>
                        field.onChange({
                          target: { name: "isAdmin", value: checked },
                        })
                      }
                    />
                  )}
                />
                <br />
                <br />
                {values.isAdmin && (
                  <p>
                    <Icon name="warning sign" size="large" color="red" /> Admins
                    can add or remove users, change templates and ISO content.
                  </p>
                )}
                <br />
                <br />
                <Button basic type="submit" disabled={isSubmitting}>
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


{/* <Grid stackable>
<Grid.Row>
  <Grid.Column width={5}>
    <Image src='https://react.semantic-ui.com/images/wireframe/image.png' />
  </Grid.Column>
  <Grid.Column width={11}>
    <Image src='https://react.semantic-ui.com/images/wireframe/centered-paragraph.png' />
  </Grid.Column>
</Grid.Row>
</Grid> */}
