import { Auth } from "aws-amplify";
import { Formik } from "formik";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Grid, Header, Icon, Label, Loader, Segment } from "semantic-ui-react";
import * as Yup from 'yup';
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import "./Login.css";

export default function Login() {
  const { setAuthenticatedUser } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);
  const [values, setValues] = useState({ email: "", password:"", newPassword: "", newPasswordConfirm: "" }); 

  const Schema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(8, 'Too Short!').required('Required'),
    newPassword: Yup.string()
      .min(8, 'Password must be 8 characters long')
      .matches(/[0-9]/, 'Password requires a number')
      .matches(/[a-z]/, 'Password requires a lowercase letter')
      .matches(/[A-Z]/, 'Password requires an uppercase letter')
      .matches(/[^\w]/, 'Password requires a symbol'),
    newPasswordConfirm: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
  });



  async function handleSubmit(values) {
    setIsLoading(true);

    try {
      let ret;
      if (newPasswordRequired) {
        await Auth.completeNewPassword(user, values.newPassword);
      } else {
        ret = await Auth.signIn(values.email, values.password);

        console.log("login", ret);

        if (ret.challengeName === "NEW_PASSWORD_REQUIRED") {
          setUser(ret);
          setNewPasswordRequired(true);
          setIsLoading(false);
          return;
        }
      }
      setAuthenticatedUser(ret.signInUserSession.idToken.payload);
      
    } catch (e) {
      console.log(e);
      onError(e);

      setIsLoading(false);
    }
  }

  return (
    <Grid textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="olive" textAlign="left">
          <Icon name="user outline" color="olive" />
          {newPasswordRequired ? "Choose a new password" : "Login"}
        </Header>
        <Formik
          initialValues={{ ...values }}
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
          }) => (
            <Form onSubmit={handleSubmit} autoComplete="off">
              <Segment>
                {!newPasswordRequired && (
                  <>
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
                  </>
                )}
                {newPasswordRequired && (
                  <>
                    {errors.newPassword && touched.newPassword ? (
                      <Label pointing="below" color="orange">
                        {errors.newPassword}
                      </Label>
                    ) : null}
                    <Form.Input
                      fluid
                      iconPosition="left"
                      icon="asterisk"
                      name="newPassword"
                      type="password"
                      placeholder="New Password"
                      value={values.newPassword}
                      onChange={handleChange}
                    />{" "}
                    {errors.newPasswordConfirm && touched.newPasswordConfirm ? (
                      <Label pointing="below" color="orange">
                        {errors.newPasswordConfirm}
                      </Label>
                    ) : null}
                    <Form.Input
                      fluid
                      iconPosition="left"
                      icon="asterisk"
                      name="newPasswordConfirm"
                      type="password"
                      placeholder="Confirm New Password"
                      value={values.newPasswordConfirm}
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
                <p style={{ textAlign: "left" }}>
                  <Link to="/login/reset">Forgot password?</Link>
                </p>
                {isLoading ? (
                  <Loader active />
                ) : (
                  <Button color="olive" type="submit" disabled={isSubmitting}>
                    Submit
                  </Button>
                )}
              </Segment>
            </Form>
          )}
        </Formik>
      </Grid.Column>
    </Grid>
  );
}
