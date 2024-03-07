import React from "react";
import { DynamicField } from "../DynamicField";
import {
  Image,
  Tab,
  TabPane,
  TableRow,
  TableHeaderCell,
  TableHeader,
  TableFooter,
  TableCell,
  TableBody,
  MenuItem,
  Icon,
  Label,
  Menu,
  Table,
  Button,
  Popup,
} from "semantic-ui-react";
import { FieldArray } from "formik";
import RiskMatrix from "../RiskMatrix";
import "./RiskRegister.css";

export default function RiskRegister({values, setFieldValue, disabled}) {
  const panes = [
    {
      menuItem: "Control the Risk",
      render: () => (
        <TabPane>
          <Image src="/control_risk.png" />
        </TabPane>
      ),
    },
    {
      menuItem: "Risk Assessment",
      render: () => (
        <TabPane>
          <Table celled className="risk-assessment-table">
            <TableHeader>
              <TableRow>
                <TableHeaderCell></TableHeaderCell>
                <TableHeaderCell>Task/ Scenario</TableHeaderCell>
                <TableHeaderCell>
                  Hazards
                  <Popup
                    trigger={<Icon name="question circle" color="blue" />}
                    content="Source or a situation with the potential for harm"
                    inverted
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  Risks / Associated harm
                  <Popup
                    trigger={<Icon name="question circle" color="blue" />}
                    content="What could go wrong? (the degree of likelihood that harm will be caused)"
                    inverted
                  />
                </TableHeaderCell>
                <TableHeaderCell>Initial Risk Rating</TableHeaderCell>
                <TableHeaderCell>
                  Controls
                  <Popup
                    trigger={<Icon name="question circle" color="blue" />}
                    content="Existing Risk Controls at time of Initial Risk Rating"
                    inverted
                  />
                </TableHeaderCell>
                <TableHeaderCell>Residual risk rating</TableHeaderCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              <FieldArray name="risks">
                {({ insert, remove, push }) => (
                  <>
                    {values.risks &&
                      values.risks.length > 0 &&
                      values.risks.map((risk, index) => (
                        <TableRow key={index}>
                          <TableCell>
                           {!disabled && <Icon name="delete" className="clickable" onClick={() => remove(index)} /> }
                          </TableCell>
                          <TableCell>
                            <DynamicField fieldDefinition={{name: `risks.${index}.task`, type: "text", basic: "true"}}
                              value={values["risks"][index]["task"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicField fieldDefinition={{name: `risks.${index}.hazard`, type: "text", basic: "true"}}
                              value={values["risks"][index]["hazard"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicField fieldDefinition={{name: `risks.${index}.harm`, type: "text", basic: "true"}}
                              value={values["risks"][index]["harm"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <RiskMatrix
                              disabled={disabled}
                              value={values["risks"][index]["initial"]}
                              onChange={(selected) =>
                                setFieldValue(`risks.${index}.initial`, selected)
                              }
                            />
                          </TableCell>
                                                    <TableCell>
                            <DynamicField fieldDefinition={{name: `risks.${index}.control`, type: "text",  basic: "true"}}
                              value={values["risks"][index]["control"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <RiskMatrix
                              disabled={disabled}
                              value={values["risks"][index]["residual"]}
                              onChange={(selected) =>
                                setFieldValue(`risks.${index}.residual`, selected)
                              }
                            />
                          </TableCell>

                        </TableRow>
                      ))}
                    {!disabled && (
                      <Button
                        compact
                        basic
                        size="tiny"
                        type="button"
                        onClick={() => push({ description: "", level: "" })}
                      >
                        <Icon name="plus" />
                        Risk Line
                      </Button>
                    )}
                  </>
                )}
              </FieldArray>
            </TableBody>
          </Table>
        </TabPane>
      ),
    },
    {
      menuItem: "Offsite & Site Risks",
      render: () => (
        <TabPane>
          <DynamicField
            fieldDefinition={{ name: "lastName", type: "text" }}
            values={values}
            valueSetter={setFieldValue}
            disabled={disabled}
          />
        </TabPane>
      ),
    },
  ];
  
  
  return (
      <div>
        <Tab panes={panes} />
      </div>
  );
}


