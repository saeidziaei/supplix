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
} from "semantic-ui-react";
import { FieldArray } from "formik";
import RiskMatrix from "../RiskMatrix";

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
          {" "}
          <Table celled>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Header</TableHeaderCell>
                <TableHeaderCell>Header</TableHeaderCell>
                <TableHeaderCell>Header</TableHeaderCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow>
                <TableCell>
                  <Label ribbon>First</Label>
                </TableCell>
                <TableCell style={{ backgroundColor: "#00FF00" }}>
                  <DynamicField
                    fieldDefinition={{ name: "cell11", type: "text" }}
                    values={values}
                    valueSetter={setFieldValue}
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>Cell</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cell</TableCell>
                <TableCell style={{ backgroundColor: "#FFFF00" }}>
                  Cell
                </TableCell>
                <TableCell>Cell</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cell</TableCell>
                <TableCell style={{ backgroundColor: "#FF0000" }}>
                  Cell
                </TableCell>
                <TableCell>Cell</TableCell>
              </TableRow>
              <FieldArray name="risks">
                {({ insert, remove, push }) => (
                  <>
                    {values.risks && values.risks.length > 0 &&
                      values.risks.map((risk, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <DynamicField
                              fieldDefinition={{
                                name: `risks.${index}.description`,
                                type: "text",
                              }}
                              value={values["risks"][index]["description"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell><RiskMatrix /> </TableCell>
                          <TableCell>Cell</TableCell>
                        </TableRow>
                      ))}
                      {!disabled &&
                    <Button compact basic size="tiny" type="button"
                      onClick={() => push({ description: "", level: "" })}
                    ><Icon name="plus"/>
                      Risk Line
                    </Button>}
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


