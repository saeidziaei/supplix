import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onError } from "../lib/errorLib";
import { makeApiCall } from "../lib/apiLib";
import { Form, Header, Loader, Segment, Grid, Icon, Button } from "semantic-ui-react";
import { Formik } from "formik";



export default function User() {
  const { username, tenantId } = useParams();
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "", phone: "", password:"" }); 
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigate();

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
          console.log(item);
          
          setUser({
            firstName: getAttribute(item, "given_name") || "",
            lastName: getAttribute(item, "family_name") || "",
            phone: getAttribute(item, "phone_number") || "",
            email: getAttribute(item, "email") || "",
            username: username
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
  async function handlePasswordReset(){
    setIsLoading(true);
    try {
      if (tenantId) {
        return await makeApiCall("POST", `/tenants/${tenantId}/users/${username}/reset-password`, {
          username,
        });
      } else {
        return await makeApiCall("POST", `/users/${username}/reset-password`, {
          username,
        });
      }
      
    } catch (e) {
      onError(e);
    }
    setIsLoading(false);
  }

  async function handleSubmit(values) {
    setIsLoading(true);
    try {
      if (username) {
        await updateUser(values);
        window.location.reload();
      } else {
        await createUser(values);
        nav("/users");
      }
    } catch (e) {
      onError(e);
      setIsLoading(false);
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
        <Header as="h2" color="olive" textAlign="center">
          <Icon name="user outline" color="olive" /> User
        </Header>
        <Formik
          initialValues={{ ...user }}
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
                  name="firstName"
                  placeholder="First Name"
                  value={values.firstName}
                  onChange={handleChange}
                />
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
                  icon="mail"
                  name="email"
                  autoComplete="off"
                  placeholder="Email"
                  value={values.email}
                  onChange={handleChange}
                />
                <Form.Input
                  fluid
                  iconPosition="left"
                  icon="phone"
                  name="phone"
                  autoComplete="off"
                  placeholder="Phone"
                  value={values.phone}
                  onChange={handleChange}
                />
                <p>Include country code, e.g. +61412345678</p>
                {!username && (
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
                )}

                <Button color="olive" type="submit" disabled={isSubmitting}>
                  Submit
                </Button>
                {username && <Button onClick={handlePasswordReset}>Reset Password</Button>}
              </Segment>
            </Form>
          )}
        </Formik>
      </Grid.Column>
    </Grid>
  );
}
