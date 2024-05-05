import { FieldArray } from "formik";
import React from "react";
import {
  Button,
  Grid,
  GridColumn,
  GridRow,
  Header,
  Icon,
  Image,
  List,
  ListItem,
  Popup,
  Segment,
  Tab,
  TabPane,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from "semantic-ui-react";
import { DynamicFieldInput } from "../DynamicFieldInput";
import RiskMatrix from "./RiskMatrix";
import "./RiskRegister.css";
import SwotTable from "./SwotTable";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";

export default function RiskRegister({values, setFieldValue, disabled, users}) {
  ModuleRegistry.registerModules([ClientSideRowModelModule]);
  const gridOptions = {
    columnDefs: [
      {
        field: "strength",
        headerName: "Strength",
        resizable: true,
        sortable: true,
        sort: 'asc',
      }, 
      { field: "opportunity", headerName: "Opportunity", resizable: true, sortable: true },
      { field: "osstrategy", headerName: "OS Strategy", resizable: true, sortable: true },
    ],
    rowStyle: { cursor: "pointer" },
    rowSelection: "single",
  };
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
      menuItem: "SWOT Analysis",
      render: () => (
        <TabPane>
          <Grid columns={2} stackable>
            <GridRow>
              <GridColumn>
                <Segment>
                  <List horizontal>
                    <ListItem>
                      <Header
                        as="h3"
                        content="S - INTERNAL STRENGTHS"
                        color="blue"
                      />
                    </ListItem>
                    <ListItem>
                      <Popup
                        flowing
                        trigger={<Icon name="question circle" color="blue" />}
                        content={
                          <List>
                            <ListItem>
                              What do our customers love most?{" "}
                            </ListItem>
                            <ListItem>What are we more efficient at? </ListItem>
                            <ListItem>What can we do for less money?</ListItem>
                            <ListItem>What can we do in less time?</ListItem>
                            <ListItem>What makes us stand out?</ListItem>
                          </List>
                        }
                        inverted
                      />
                    </ListItem>
                  </List>

                  <SwotTable
                    key="strengths"
                    values={values}
                    color="blue"
                    tableName="strengths"
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                </Segment>
              </GridColumn>
              <GridColumn>
                <Segment>
                  <List horizontal>
                    <ListItem>
                      <Header
                        as="h3"
                        content="W - INTERNAL WEAKNESSSES"
                        color="orange"
                      />
                    </ListItem>
                    <ListItem>
                      <Popup
                        flowing
                        trigger={<Icon name="question circle" color="orange" />}
                        content={
                          <List>
                            <ListItem>Where do we lack efficiency? </ListItem>
                            <ListItem>Where are we wasting money? </ListItem>
                            <ListItem>
                              Where are we wasting time and resources?
                            </ListItem>
                            <ListItem>
                              What do our competitors do better?
                            </ListItem>
                            <ListItem>
                              What are our top customer complaints?
                            </ListItem>
                          </List>
                        }
                        inverted
                      />
                    </ListItem>
                  </List>
                  <SwotTable
                    values={values}
                    color="orange"
                    tableName="weaknesses"
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                </Segment>
              </GridColumn>
            </GridRow>

            <GridRow>
              <GridColumn>
                <Segment>
                  <List horizontal>
                    <ListItem>
                      <Header
                        as="h3"
                        content="O - EXTERNAL OPPORTUNITIES"
                        color="green"
                      />
                    </ListItem>
                    <ListItem>
                      <Popup
                        flowing
                        trigger={<Icon name="question circle" color="green" />}
                        content={
                          <List>
                            <ListItem>What is missing in our market?</ListItem>
                            <ListItem>
                              What could we create or do better than a
                              competitor?
                            </ListItem>
                            <ListItem>What new trends are occurring?</ListItem>
                            <ListItem>
                              What new technology could we use?
                            </ListItem>
                            <ListItem>
                              What openings in the market are there?
                            </ListItem>
                          </List>
                        }
                        inverted
                      />
                    </ListItem>
                  </List>

                  <SwotTable
                    values={values}
                    color="green"
                    tableName="opportunities"
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                </Segment>
              </GridColumn>
              <GridColumn>
                <Segment>
                  <List horizontal>
                    <ListItem>
                      <Header
                        as="h3"
                        content="T - EXTERNAL THREATS"
                        color="red"
                      />
                    </ListItem>
                    <ListItem>
                      <Popup
                        flowing
                        trigger={<Icon name="question circle" color="red" />}
                        content={
                          <List>
                            <ListItem>
                              What changes are occurring in our market's
                              environment?
                            </ListItem>
                            <ListItem>
                              What technologies could replace what we do?
                            </ListItem>
                            <ListItem>
                              What changes are occurring in the way we're being
                              discovered?
                            </ListItem>
                            <ListItem>
                              What social changes could threaten us?
                            </ListItem>
                            <ListItem>
                              Are there any threatening government policies or
                              regulations?
                            </ListItem>
                          </List>
                        }
                        inverted
                      />
                    </ListItem>
                  </List>

                  <SwotTable
                    key="threats"
                    values={values}
                    color="red"
                    tableName="threats"
                    setFieldValue={setFieldValue}
                    disabled={disabled}
                  />
                </Segment>
              </GridColumn>
            </GridRow>
          </Grid>
        </TabPane>
      ),
    },

    {
      menuItem: "Business Risk Assessment",
      render: () => (
        <TabPane>
          <Table celled className="risk-assessment-table">
          <TableHeader>
              <TableRow>
                <TableHeaderCell colspan="4"></TableHeaderCell>
                <TableHeaderCell className="first-header" colspan="2">Pre-Mitigation</TableHeaderCell>
                <TableHeaderCell className="first-header"  colspan="2">Residual Risk Post Mitigation</TableHeaderCell>
                <TableHeaderCell className="first-header" colspan="4">Planning</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableHeader>
              <TableRow>
                <TableHeaderCell></TableHeaderCell>
                <TableHeaderCell>Weakness</TableHeaderCell>
                <TableHeaderCell>Threat</TableHeaderCell>
                <TableHeaderCell>
                  Impact
                  <Popup
                    trigger={<Icon name="question circle" color="blue" />}
                    content="Source or a situation with the potential for harm"
                    inverted
                  />
                </TableHeaderCell>
                <TableHeaderCell>Initial Risk Rating</TableHeaderCell>
                <TableHeaderCell>
                  Existing Risk Controls
                  <Popup
                    trigger={<Icon name="question circle" color="blue" />}
                    content="Existing Risk Controls at time of Initial Risk Rating"
                    inverted
                  />
                </TableHeaderCell>
                <TableHeaderCell>Residual risk rating</TableHeaderCell>
                <TableHeaderCell>
                  Further controls/ Actions
                </TableHeaderCell>
                <TableHeaderCell>Resources Required</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Implementation Date</TableHeaderCell>
                <TableHeaderCell>Progress Update</TableHeaderCell>
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
                            {!disabled && (
                              <Icon
                                name="delete"
                                className="clickable"
                                onClick={() => remove(index)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.weakness`,
                                type: "dropdown",
                                basic: "true",
                                options:
                                  values &&
                                  values.weaknesses &&
                                  values.weaknesses.length > 0
                                    ? values.weaknesses.map(
                                        (weakness, index) => ({
                                          key: index,
                                          value: index,
                                          text: weakness.item,
                                        })
                                      )
                                    : null,
                              }}
                              value={values["risks"][index]["weakness"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.threat`,
                                type: "dropdown",
                                basic: "true",
                                options:
                                  values &&
                                  values.threats &&
                                  values.threats.length > 0
                                    ? values.threats.map(
                                        (threat, index) => ({
                                          key: index,
                                          value: index,
                                          text: threat.item,
                                        })
                                      )
                                    : null,
                              }}
                              value={values["risks"][index]["threat"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.impact`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["risks"][index]["impact"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <RiskMatrix
                              disabled={disabled}
                              value={values["risks"][index]["initial"]}
                              onChange={(selected) =>
                                setFieldValue(
                                  `risks.${index}.initial`,
                                  selected
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.existingControl`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["risks"][index]["existingControl"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                         
                          <TableCell>
                            <RiskMatrix
                              disabled={disabled}
                              value={values["risks"][index]["residual"]}
                              onChange={(selected) =>
                                setFieldValue(
                                  `risks.${index}.residual`,
                                  selected
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.furtherControl`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["risks"][index]["furtherControl"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.resources`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["risks"][index]["resources"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              users={users}
                              fieldDefinition={{
                                name: `risks.${index}.owner`,
                                type: "employee",
                                compact: disabled,
                              }}
                              value={values["risks"][index]["owner"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.implementationDate`,
                                type: "date",
                              }}
                              value={values["risks"][index]["implementationDate"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `risks.${index}.progressUpdate`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["risks"][index]["progressUpdate"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
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
      menuItem: "Business Opportunity Assessment",
      render: () => (
        <TabPane><>
          {/* <div
            className="ag-theme-balham"
            style={{
              height: "500px",
              width: "100%",
            }}
          >
            <AgGridReact
              gridOptions={gridOptions}
              rowData={values.bizopportunities}
              rowHeight="35"
              animateRows={true}
            ></AgGridReact>
          </div> */}
          <Table celled className="bizopportunity-assessment-table">

            <TableHeader>
              <TableRow>
                <TableHeaderCell></TableHeaderCell>
                <TableHeaderCell>Strength</TableHeaderCell>
                <TableHeaderCell>Opportunity</TableHeaderCell>
                <TableHeaderCell>SO Strategy</TableHeaderCell>
                <TableHeaderCell>Decided Actions</TableHeaderCell>
                <TableHeaderCell>Resources Required</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Implementation Date</TableHeaderCell>
                <TableHeaderCell>Progress Update</TableHeaderCell>

              </TableRow>
            </TableHeader>

            <TableBody>
              <FieldArray name="bizopportunities">
                {({ insert, remove, push }) => (
                  <>
                    {values.bizopportunities &&
                      values.bizopportunities.length > 0 &&
                      values.bizopportunities.map((bizopportunity, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {!disabled && (
                              <Icon
                                name="delete"
                                className="clickable"
                                onClick={() => remove(index)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.strength`,
                                type: "dropdown",
                                basic: "true",
                                options:
                                  values &&
                                  values.strengths &&
                                  values.strengths.length > 0
                                    ? values.strengths.map(
                                        (strength, index) => ({
                                          key: index,
                                          value: index,
                                          text: strength.item,
                                        })
                                      )
                                    : null,
                              }}
                              value={values["bizopportunities"][index]["strength"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.opportunity`,
                                type: "dropdown",
                                basic: "true",
                                options:
                                  values &&
                                  values.opportunities &&
                                  values.opportunities.length > 0
                                    ? values.opportunities.map(
                                        (opportunity, index) => ({
                                          key: index,
                                          value: index,
                                          text: opportunity.item,
                                        })
                                      )
                                    : null,
                              }}
                              value={values["bizopportunities"][index]["opportunity"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.sostrategy`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["bizopportunities"][index]["sostrategy"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                          <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.decidedActions`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["bizopportunities"][index]["decidedActions"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.resources`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["bizopportunities"][index]["resources"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              users={users}
                              fieldDefinition={{
                                name: `bizopportunities.${index}.owner`,
                                type: "employee",
                                compact: disabled,
                              }}
                              value={values["bizopportunities"][index]["owner"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.implementationDate`,
                                type: "date",
                              }}
                              value={values["bizopportunities"][index]["implementationDate"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
                            />
                          </TableCell>
                          <TableCell>
                            <DynamicFieldInput
                              fieldDefinition={{
                                name: `bizopportunities.${index}.progressUpdate`,
                                type: "text",
                                basic: "true",
                              }}
                              value={values["bizopportunities"][index]["progressUpdate"]}
                              valueSetter={setFieldValue}
                              disabled={disabled}
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
                        
                      </Button>
                    )}
                  </>
                )}
              </FieldArray>
            </TableBody>
          </Table></>
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


