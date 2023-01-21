import React from "react";
import LoaderButton from "../components/LoaderButton";
import Card from "react-bootstrap/Card";
import { Formik, Field, Form } from "formik";
import Table from "react-bootstrap/Table";
import FormHeader from "../components/FormHeader";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function GenericForm() {
  // const [isLoading, setIsLoading] = useState(true);


  const formDef = {
    title: "New Employee Induction Checklist",
    sections: [
      {
        fields: [
          { name: "q1", title: "First Question", type: "text" },
          { name: "q11", title: "XYZ Question", type: "text" },
          { name: "q12", title: "A Question", type: "text" },
          { name: "q13", title: "B Question", type: "text" },
          {
            name: "q2",
            title: "Second Question",
            type: "radio",
            options: ["Yes", "No", "N/A"],
          },
        ],
      },
      {
        fields: [
          { name: "q1", title: "First Question", type: "text" },
          { name: "q11", title: "XYZ Question", type: "text" },
          { name: "q12", title: "A Question", type: "text" },
          { name: "q13", title: "B Question", type: "text" },
          {
            name: "q2",
            title: "Second Question",
            type: "radio",
            options: ["Yes", "No", "N/A"],
          },
        ],
      },
    ],
  };

  const values ={
    q1: "", q2: ""
  }

  function renderField(f) {
    if (f.type == "text")
      return <Field name={f.name} id={f.name} />;
    else if (f.type == "radio") return (
      <div role="group" aria-labelledby="my-radio-group">
        {f.options.map((option) => (
          <label>
            <Field type="radio" name={f.name} value={option} />
            {option}
          </label>
        ))}
      </div>
    );
    else 
       return <div>Unsupported Field</div>
  }
  return (
    <>

      <Card className="py-3 px-3 print-container">

        <FormHeader heading={formDef.title} />
        <Formik initialValues={values}>
          {({ handleSubmit, isSubmitting, setFieldValue }) => (
            <Form onSubmit={handleSubmit}>
              {formDef.sections.map((section) => (
                <>
                  <Row> 
                    <Col sm="10">
                      {" "}
                      <Table size="sm" responsive striped hover>
                        <tbody>
                          {section.fields.map((f) => (
                            <tr>
                              <td>{f.title}</td>
                              <td colSpan={3}>{renderField(f)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                    <Col sm="2">Owner</Col>
                  </Row>

                  <hr />
                </>
              ))}

              <LoaderButton type="submit" className="ms-auto hide-in-print bg-success">
                Submit
              </LoaderButton>
              <LoaderButton  className="bg-primary">Primary</LoaderButton>
              <LoaderButton  className="bg-secondary">Secondary</LoaderButton>
              <LoaderButton  className="bg-danger">Dander</LoaderButton>

            </Form>
          )}
        </Formik>
      </Card>
    </>
  );
}
