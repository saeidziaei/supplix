import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FormHeader from "../FormHeader";
import Card from 'react-bootstrap/Card';
import { Formik, Field, Form } from 'formik';
import LoaderButton from "../LoaderButton";

export default function NewEmployeeInductionChecklist({
  onSubmit,
  initialValues,
  isLoading
}) {
    // useAppContext for company name and logoUrl    
    const imgUrl = 'https://www.mecmining.com.au/wp-content/uploads/2017/09/GOLD-1024x576.jpg';
    const questions = [
      { name: "companyHistory", title: "Company history" },
      { name: "structureAndOrganisation", title: "Structure and organisation" },
      {
        name: "inducteesPosition",
        title: "Inductee’s position in the organisation",
      },
      {
        name: "inducteesRoleAndResponsibilities",
        title:
          "Inductee’s role and responsibilities in the organisation (Copy of Position Description)",
      },
      {
        name: "companyIMSPoliciesAndObjectives",
        title: "Company IMS policies and objectives",
      },
      { name: "relevantIMSDocuments", title: "Relevant IMS documents " },
      {
        name: "roleAndResponsibilitiesForIMSProcedures",
        title: "Role and responsibilities for IMS procedures",
      },
      {
        name: "introductionToFilingSystems",
        title: "Introduction to filing systems",
      },
      {
        name: "salarySuperannuationHours",
        title:
          "Salary, Superannuation, Normal hours of work, Timesheets & Commitment Reports",
      },
      {
        name: "introductionToOtherEmployees",
        title: "Introduction to other employees",
      },
      {
        name: "accidentReportingAndFirstAidPoint",
        title: "Accident reporting and First Aid point(s) and kit(s)",
      },
      {
        name: "emergencyProcedures",
        title:
          "Emergency procedures and emergency exit locations and assembly point(s)",
      },
      {
        name: "fireExtinguishers",
        title: "Fire extinguisher and/or fire hose reel location(s)",
      },
      {
        name: "lunchroomsToilets",
        title:
          "Lunchrooms, toilets, washrooms, change/locker rooms & other amenity areas",
      },
      {
        name: "issueAndUseOfPersonalProtectiveEquipment",
        title: "Issue and use of personal protective equipment (PPE)",
      },
      {
        name: "issueAndUseOfCompanysTools",
        title: "Issue and use of Company’s tools & equipment",
      },
      {
        name: "purchasingRequirementsAndAuthorities",
        title: "Purchasing requirements and authorities",
      },
      { name: "workAreaHousekeeping", title: "Work area housekeeping" },
    ];

    const values = initialValues || {
      employeeName: "",
      email: "",
      ...questions.reduce((acc, q) => {
        // goes through questions and genrates a field using the q's name and a default value
        acc[q.name] = "";
        return acc;
      }, {}),
    };



    return (
      <Card className="py-3 px-3">
        <FormHeader
          heading="New Employee Induction Checklist"
          imageUrl={imgUrl}
        />
        <Formik
          initialValues={values}
          onSubmit={onSubmit}
        >
          {({ handleSubmit, isSubmitting }) => (
            <Form onSubmit={handleSubmit}>
              <Card className="py-3 px-3 my-3">
                <label htmlFor="employeeName">Employee Name</label>
                <Field
                  id="employeeName"
                  name="employeeName"
                  placeholder="Employee Name"
                />
              </Card>
             
                <Row className="heading">
                  <Col sm="10">Item</Col>
                  <Col sm="2">Completed</Col>
                </Row>
                {questions.map((q, i) => (
                  <Row key={i} className={`my-1 ${i % 2 ? "odd" : "even"}`}>
                    <Col sm="10">{q.title}</Col>
                    <Col sm="2">
                      <div role="group" aria-labelledby="my-radio-group">
                        <label>
                          <Field type="radio" name={q.name} value="Yes" />
                          Yes
                        </label>
                        <label>
                          <Field type="radio" name={q.name} value="No" />
                          No
                        </label>
                      </div>
                    </Col>
                  </Row>
                ))}
     
              <LoaderButton type="submit" isLoading={isLoading} >
                Submit
              </LoaderButton>
            </Form>
          )}
        </Formik>
      </Card>
    );


}