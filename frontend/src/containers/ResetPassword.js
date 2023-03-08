import { Auth } from "aws-amplify";
import { Formik } from "formik";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button, Form, Grid, Header, Icon, Label,
  Message, Segment
} from "semantic-ui-react";
import * as Yup from "yup";
import { onError } from "../lib/errorLib";

export default function ResetPassword() {
  const [values, setValues] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const SchemaEmail = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
  });
  const SchemaCode = Yup.object().shape({
    code: Yup.number().integer().required("Required"),
    password: Yup.string()
      .min(8, "Password must be 8 characters long")
      .matches(/[0-9]/, "Password requires a number")
      .matches(/[a-z]/, "Password requires a lowercase letter")
      .matches(/[A-Z]/, "Password requires an uppercase letter")
      .matches(/[^\w]/, "Password requires a symbol"),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref("password"), null],
      "Passwords must match"
    ),
  });

  const [codeSent, setCodeSent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values) {
    setIsLoading(true);
console.log(values, codeSent, confirmed);
    try {
      if (!codeSent) {
        await Auth.forgotPassword(values.email);
        setCodeSent(true);
      } else if (!confirmed) {
        await Auth.forgotPasswordSubmit(
          values.email,
          values.code,
          values.password
        );
        setConfirmed(true);
      }
    } catch (error) {
      onError(error);
      setIsLoading(false);
    }
  }

  function renderRequestCodeForm(values, errors, touched, handleChange) {
    return (
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
        />{" "}
      </>
    );
  }

  function renderConfirmationForm(values, errors, touched, handleChange) {
    return (
      <>
        {errors.code && touched.code ? (
          <Label pointing="below" color="orange">
            {errors.code}
          </Label>
        ) : null}
        <Form.Input
          fluid
          iconPosition="left"
          icon="hashtag"
          name="code"
          type="tel"
          placeholder="Code"
          value={values.code}
          onChange={handleChange}
        />
        <p>
          {" "}
          Please check your email ({values.email}) for the confirmation code.
        </p>
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

        {errors.confirmPassword && touched.confirmPassword ? (
          <Label pointing="below" color="orange">
            {errors.confirmPassword}
          </Label>
        ) : null}
        <Form.Input
          fluid
          iconPosition="left"
          icon="asterisk"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={values.confirmPassword}
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
    );
  }

  function renderSuccessMessage() {
    return (
      <>
        <Message
          header="Success"
          content="Your password has been reset."
          icon="exclamation"
        />
        <p>
          <Link to="/login">
            Click here to login with your new credentials.
          </Link>
        </p>
      </>
    );
  }

  return (
    <Grid textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="olive" textAlign="left">
          <Icon name="user outline" color="olive" />
          {!codeSent
            ? "Password Reset"
            : !confirmed
            ? "Confirm code"
            : "Your Password Changed!"}
        </Header>

        <Formik
          initialValues={{ ...values }}
          validationSchema={!codeSent ? SchemaEmail : SchemaCode}
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
                {!codeSent
                  ? renderRequestCodeForm(values, errors, touched, handleChange)
                  : !confirmed
                  ? renderConfirmationForm(
                      values,
                      errors,
                      touched,
                      handleChange
                    )
                  : renderSuccessMessage()}

                <Button color="olive" type="submit">
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
