import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Card from "react-bootstrap/Card";
import Stack from "react-bootstrap/Stack";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../lib/errorLib";
import config from "../config";
import { useFormFields } from "../lib/hooksLib";
import "./Customer.css";
import { Storage } from "aws-amplify";
import { s3Upload } from "../lib/awsLib";
import { jwtApi } from "../lib/apiLib";

export default function Customer() {
  const file = useRef(null);
  const [fields, handleFieldChange, setFields] = useFormFields({
    companyName: "",
    ABN: "",
    notes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
  });
  
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(); // Original customer before save
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const callJwtAPI = jwtApi();

  function validateForm() {
    return fields.companyName.length > 0;
  }

  useEffect(() => {
    function loadCustomer() {
      return callJwtAPI("GET", `/customers/${customerId}`);
    }

    async function onLoad() {
      try {
        if (customerId) {
          const item = await loadCustomer();
          
          setFields({...item});
          if (item.logo) {
            item.logoURL = await Storage.get(item.logo);
          }
          setCustomer(item);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  // // Removes the timestamp prefix
  // function formatFilename(str) {
  //   return str.replace(/^\w+-/, "");
  // }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // other validatoins ... TODO

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

      if (customerId) {
        if (logo) { 
          // the user has picked a new logo. Delete the original file if any exists
          if (customer.logo) 
          try {
            await Storage.remove(customer.logo);
          } catch (e) {
            console.log(e);// ignore
          }
        } else {
          // the user hasn't changed the log. Use the origianl value
          logo = customer.logo;
        }
        console.log(logo);
        await updateCustomer({ ...fields, logo });
        window.location.reload(); 
      } else {
        await createCustomer({ ...fields, logo });
        nav("/customers");
      }
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }
  function createCustomer(customer) {
    return callJwtAPI("POST", "/customers", customer);
  }
  function updateCustomer(customer) {
    return callJwtAPI("PUT", `/customers/${customerId}`, customer);
  }

  return (
    <div className="NewCustomer">
      <Form onSubmit={handleSubmit}>
        <Stack gap={3}>
          <FloatingLabel controlId="companyName" label="Company Name">
            <Form.Control
              value={fields.companyName}
              onChange={handleFieldChange}
              placeholder="Company Name"
              size="lg"
            />
          </FloatingLabel>
          <Form.Group controlId="file">
            <Form.Label>Logo</Form.Label>
            {customer && customer.logoURL && (
              <p>
                
                <img src={customer.logoURL} alt="Company Logo" style={{width: "250px"}} />
              </p>
            )}
            <Form.Control onChange={handleFileChange} type="file" />
          </Form.Group>
          <FloatingLabel controlId="ABN" label="ABN">
            <Form.Control
              value={fields.ABN}
              onChange={handleFieldChange}
              placeholder="ABN"
            />
          </FloatingLabel>
          <Card className="px-1 py-2">
            Contact Person
            <FloatingLabel
              controlId="contactName"
              label="Name"
              className="mb-1"
            >
              <Form.Control
                value={fields.contactName}
                onChange={handleFieldChange}
                placeholder="Name"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="contactPhone"
              label="Phone"
              className="mb-1"
            >
              <Form.Control
                value={fields.contactPhone}
                onChange={handleFieldChange}
                placeholder="Phone"
              />
            </FloatingLabel>
            <FloatingLabel controlId="contactEmail" label="Email">
              <Form.Control
                value={fields.contactEmail}
                type="email"
                onChange={handleFieldChange}
                placeholder="email@example.com"
              />
            </FloatingLabel>
          </Card>

          <Form.Group controlId="notes">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              value={fields.notes}
              as="textarea"
              onChange={handleFieldChange}
            />
          </Form.Group>
          <LoaderButton
            block="true"
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            disabled={!validateForm()}
          >
            {customerId ?  "Update" : "Create" }
          </LoaderButton>
        </Stack>
      </Form>
    </div>
  );
}
