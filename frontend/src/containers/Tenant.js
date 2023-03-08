import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Grid, Header, Icon, Image, Loader, Segment } from "semantic-ui-react";
import config from "../config";
import { makeApiCall } from "../lib/apiLib";
import { s3Get, s3Remove, s3Upload } from "../lib/awsLib";
import { onError } from "../lib/errorLib";
import placeholderImage from './fileplaceholder.jpg';

export default function Tenant() {
  const file = useRef(null);

  const { tenantId } = useParams();
  const [tenant, setTenant] = useState({ tenantName: "", contactPerson: "", contactNumber: "", contactEmail: "", website:"", note: "" }); 
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadTenant() {
      const tenant = await makeApiCall("GET", `/tenants/${tenantId}`);
      if (tenant && tenant.logo) {
        tenant.logoURL = await s3Get(tenant.logo);
      }
      return tenant;
    }

    async function onLoad() {
      try {
        if (tenantId) {
          const item = await loadTenant();

          setTenant(item);
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
      let logo = file.current ? await s3Upload(file.current) : null;

      if (tenantId) {
        // edit mode
        if (logo) {
          // the user has picked a new logo for an existing tenant. Delete the original file if any exists
          if (tenant.logo)
            try {
              await s3Remove(tenant.logo);
            } catch (e) {
              console.log(e); // ignore
            }
        } else {
          // the user hasn't changed the log. Use the origianl value
          logo = tenant.logo;
        }

        await updateTenant({ ...values, logo });
        window.location.reload();
      } else {
        await createTenant({ ...values, logo });
        nav("/tenants");
      }
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  async function createTenant(item) {
    return await makeApiCall("POST", "/tenants", item);
  }
  async function updateTenant(item) {
    return await makeApiCall("PUT", `/tenants/${tenantId}`, item);
  }

  function rednerTenant() {
    return (
      <Grid
        textAlign="center"
        style={{ height: "100vh" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" color="blue" textAlign="center">
            <Icon name="users" color="blue" /> Tenant
          </Header>
          <Formik
            initialValues={{...tenant}}
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
                <Segment >
                  <Form.Input  fluid iconPosition="left" icon="tag" name="tenantName" placeholder="Name" value={values.tenantName} onChange={handleChange} />
                  <Header as="h5" floated="left">Logo</Header>
                  
                  {tenant.logoURL &&
                  
                   <Image
                    src={tenant.logoURL}
                    rounded
                    alt="Logo"
                    onError={(e) => {
                      e.target.src = placeholderImage;
                    }}
                  /> }
                  <Form.Input onChange={handleFileChange} type="file" />
                  <Form.Input  fluid iconPosition="left" icon="user outline" name="contactPerson" placeholder="Contact Person" value={values.contactPerson} onChange={handleChange} />
                  <Form.Input  fluid iconPosition="left" icon="phone" name="contactNumber" placeholder="Contact Number" value={values.contactNumber} onChange={handleChange} />
                  <Form.Input  fluid iconPosition="left" icon="mail" name="contactEmail" placeholder="Contact Email" value={values.contactEmail} onChange={handleChange} />
                  <Form.Input  fluid iconPosition="left" icon="globe" name="website" placeholder="Website address" value={values.website} onChange={handleChange} />
                  <Form.Input
                    fluid
                    iconPosition="left"
                    icon="comment"
                    name="note"
                    placeholder="Note"
                    value={values.note}
                    onChange={handleChange}
                  />

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



  if (isLoading) return <Loader active />;

  return rednerTenant(tenant);
  
}
