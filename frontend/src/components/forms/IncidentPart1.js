import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FormHeader from "../FormHeader";
import Card from "react-bootstrap/Card";
import { Formik, Field, Form } from "formik";
import Table from "react-bootstrap/Table";
import LoaderButton from "../LoaderButton";
import ImageMarker from "react-image-marker";

export default function IncidentPart1({ isLoading, onSubmit, initialValues }) {
  const values = initialValues || {
    location: "",
    incidentDate: "",
    incidentTime: "",
    reportDate: "",
    classOfIncident: "",
    isNotifiable: "",
    incidentNarrative: "",
    personName: "",
    markers: [],
    gender: "",
    mechanismOfInjury: "",
  };
  const [markers, setMarkers] = useState(values.markers);
  function handleResetMarkers(e) {
    e.preventDefault(); 
    setMarkers([]);
  }
  return (
    <Card className="py-3 px-3 print-container">
      <FormHeader heading="New Employee Induction Checklist" />
      <Formik initialValues={values} onSubmit={onSubmit}>
        {({ handleSubmit, isSubmitting, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Table size="sm" borderless responsive striped="columns">
              <tbody>
                <tr>
                  <td></td>
                  <td>Location</td>
                  <td>
                    <Field name="location" id="location" />
                  </td>
                  <td>Date of report</td>
                  <td>
                    <Field name="reportDate" id="reportDate" />
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Date of incident</td>
                  <td>
                    <Field name="incidentDate" id="incidentDate" />
                  </td>
                  <td>Time of incident</td>
                  <td>
                    <Field name="incidentTime" id="incidentTime" />
                  </td>
                </tr>
              </tbody>
            </Table>
            <div role="group" aria-labelledby="my-radio-group">
              <label>
                <Field type="radio" name="classOfIncident" value="class1" />
                Class 1 - Insignificant: First aid treatment on site required
              </label>
              <br />
              <label>
                <Field type="radio" name="classOfIncident" value="class2" />
                Class 2 - Minor: Minor Injury requiring first aid treatment by a
                medical facility (e.g. minor cuts, bruises, bumps)
              </label>
              <br />
              <label>
                <Field type="radio" name="classOfIncident" value="class3" />
                Class 3 - Serious: Serious injury (injuries) requiring medical
                treatment or hospitalisation (or &lt 10 minor injuries)
              </label>
              <br />
              <label>
                <Field type="radio" name="classOfIncident" value="class4" />
                Class 4 - Major: Injury resulting in permanent disability (or
                &lt 10 Serious injuries)
              </label>
              <br />
              <label>
                <Field type="radio" name="classOfIncident" value="class5" />
                Class 5 - Catastrophic: Injuries resulting in single or multiple
                fatalities
              </label>
              <br />
            </div>

            <div role="group" aria-labelledby="my-radio-group">
              <label>
                <Field type="radio" name="classOfIncident" value="yes" />
                Yes
              </label>
              <br />
              <label>
                <Field type="radio" name="classOfIncident" value="no" />
                No
              </label>
              <br />
            </div>

            <Card className="py-1 px-1 my-1">
              How accident/incident occurred:
              <Field
                as="textarea"
                name="incidentNarrative"
                id="incidentNarrative"
              />
            </Card>

            <div>
              Name: <Field name="personName" id="personName" />
            </div>
            <ImageMarker
              src="../incident_map.png"
              markers={markers}
              onAddMarker={(marker) => setMarkers([...markers, marker])}
            />
            <button onClick={handleResetMarkers}>Reset Markers</button>
            <LoaderButton
              type="submit"
              className="ms-auto hide-in-print"
              isLoading={isLoading}
            >
              Submit
            </LoaderButton>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
