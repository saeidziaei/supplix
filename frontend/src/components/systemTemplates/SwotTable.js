import { FieldArray } from "formik";
import React from "react";
import { Button, Icon, Table, TableBody, TableCell, TableRow } from "semantic-ui-react";
import { DynamicFieldInput } from "../DynamicFieldInput";
const SwotTable = ({ values, tableName, color, setFieldValue, disabled }) => {
  return (
    <Table celled className={tableName} color={color} key={tableName} >
      <TableBody>
        <FieldArray name={tableName}>
          {({ insert, remove, push }) => (
            <>
              {values[tableName] &&
                values[tableName].length > 0 &&
                values[tableName].map((_, index) => (
                  <TableRow key={index}>
                    {!disabled && (
                      <TableCell>
                        <Icon
                          name="delete"
                          className="clickable"
                          onClick={() => remove(index)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <DynamicFieldInput
                        fieldDefinition={{
                          name: `${tableName}.${index}.item`,
                          type: "text",
                          basic: "true",
                        }}
                        value={values[tableName][index]["item"]}
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
                  onClick={() => push({ item: "" })}
                >
                  <Icon name="plus" />
                </Button>
              )}
            </>
          )}
        </FieldArray>
      </TableBody>
    </Table>
  );
};

export default SwotTable;
