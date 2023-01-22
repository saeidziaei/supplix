import React from 'react';
import { Formik } from 'formik';
import { Form, Input, SubmitButton, ResetButton, FormikDebug, Radio, Select } from 'formik-semantic-ui-react';
import FormHeader from "../components/FormHeader";
import { Checkbox, Grid, Header, Icon, Segment, Table, Button, Label } from 'semantic-ui-react';



export default function GenericForm({values}) {
  // const [isLoading, setIsLoading] = useState(true);


  const formDef = {
    title: "New Employee Induction Checklist",
    sections: [
      {
        title: "First Part", 
        fields: [
          { name: "q1", title: "This is to show the type email", type: "email" },
          { name: "q11", title: "This is an info field", type: "info", description: "Be careful. This section has implications!" },
          { name: "q12", title: "A Question - This is a long sentence that needs to fit in the form", type: "text" },
          { name: "q13", title: "B Question", type: "text" },
          {
            name: "q14",
            title: "Second Question",
            type: "radio",
            options: ["Yes", "No", "N/A"],
          },
        ],
      },
      {
        title: "This is the second part",
        fields: [
          { name: "q21", title: "First Question", type: "text" },
          { name: "q24", title: "B Question", type: "text" },
          {
            name: "q26",
            title: "Gender ?",
            type: "select",
            options: ["Male", "Female", "Prefer not to say"],
          },
          {
            name: "q25",
            title: "Gender ?",
            type: "radio",
            options: ["Male", "Female"],
          },
          { name: "q22", title: "XYZ Question", type: "text" },
          { name: "q23", title: "A Question", type: "email" },
        ],
      },
    ],
  };
  const defaultValues = {
  ...formDef.sections.reduce((acc, section) => {
    return acc.concat(section.fields);
  }, []).reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {})

  };

  const initialValues = values || defaultValues;

  function renderField(f) {
    const name = f.name;
    const id = `input-${f.name}`;
    switch (f.type) {
      case "info":
        return (
          <Label as="a" color="teal" pointing="below">
            {f.description}
          </Label>
        );

      case "text":
        return <Input size="small" name={name} id={id} />;

      case "email":
        return <Input name={name} id={id} icon="at" fluid errorPrompt />;
      // code block to be executed if expression === value2

      case "radio":
        return (
          <Button.Group>
            {f.options.map((o) => (
              <Button basic color="blue" key={o}>
                <Radio label={o} name={name} value={o} />
              </Button>
            ))}
          </Button.Group>
        );

      case "select":
        const options = f.options.map((o) => ({value: o, text: o}));
        return <Select options={options} name={name} id={id} />;

      default:
        return <div>Unsupported Field</div>;
    }
  }

  return (
    
      <Segment>
        <FormHeader heading={formDef.title} />
        <Formik
          initialValues={initialValues}
        >
          <Form size="small">
          
     
            {formDef.sections.map((section, i) => (
                <Segment color="teal" key={section.title}>
                  <Grid>
                  <Grid.Column width={14}>
                  <Table celled striped  compact stackable>
                        <Table.Header>
                          <Table.Row>
                            <Table.HeaderCell colSpan="5">
                              {section.title}
                            </Table.HeaderCell>
                          </Table.Row>
                        </Table.Header>

                        <Table.Body>
                          
                          {section.fields.map((f, i) => (
                            <Table.Row key={f.name}>
                              <Table.Cell width={1} ><Checkbox label='' /></Table.Cell>
                              <Table.Cell width={6}>{f.title}</Table.Cell>
                              <Table.Cell width={6} textAlign="center">
                                {renderField(f)}
                              </Table.Cell>
                              <Table.Cell width={1} >
                                {
                                  (i % 3 == 0 ) && <Icon name="check" color="green" size='large' />
                                }
                                {
                                  (i % 3 == 1 ) && <Icon name="crosshairs" color="red" size='large' />
                                }
                                {
                                  (i % 3 == 2 ) && <Icon name="star" color="yellow" size='large' />
                                }
                            </Table.Cell>
                            <Table.Cell  width={1} >
                              <Header as="h2" textAlign="center">
                                A
                              </Header>
                            </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </Grid.Column>
                    <Grid.Column width={2} verticalAlign="middle" textAlign='center'>Owner</Grid.Column>
                  </Grid>
                </Segment>

            ))}

            <SubmitButton fluid primary>
              Login
            </SubmitButton>
            <ResetButton fluid secondary>
              Reset
            </ResetButton>
            <FormikDebug />
          </Form>
        </Formik>
      </Segment>
    
  );
}



// import React from "react";
// import { Formik } from "formik";
// import {
//   Checkbox,
//   Form,
//   FormikDebug,
//   Input,
//   ResetButton,
//   SubmitButton
// } from "formik-semantic-ui-react";


// export default function GenericForm() {
//   const initialValues = {
//     email: "a@a.com",
//     password: "12345678",
//     remember: false
//   };


//   return (
    
//       <Formik
//         initialValues={initialValues}
        
//         onSubmit={(_, { setSubmitting }) => {
//           setTimeout(() => {
//             setSubmitting(false);
//           }, 1000);
//         }}
//       >
//         <Form size="large">
//           <Input
//             id="input-email"
//             inputLabel="Email"
//             name="email"
//             icon="at"
//             iconPosition="right"
//             placeholder="Email"
//             focus
//             fluid
//             errorPrompt
//           />
//           <Input
//             id="input-password"
//             inputLabel={{ color: "purple", content: "Password" }}
//             name="password"
//             icon="key"
//             iconPosition="right"
//             type="password"
//             placeholder="Password"
//             autoComplete="on"
//             focus
//             fluid
//             errorPrompt
//           />
//           <Checkbox
//             id="checkbox-remember"
//             name="remember"
//             label="Remember ?"
//             errorPrompt={{ pointing: "left" }}
//           />
//           <SubmitButton fluid primary>
//             Login
//           </SubmitButton>
//           <ResetButton fluid color="green">
//             Reset
//           </ResetButton>
//           <FormikDebug />
//         </Form>
//       </Formik>

//   );
// };
