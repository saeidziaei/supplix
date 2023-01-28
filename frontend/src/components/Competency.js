import React, { useState } from "react";
import "./FormHeader.css";
import { Grid, Icon, Menu } from "semantic-ui-react";
import "./Competency.css";
import { Input, Radio,   } from "formik-semantic-ui-react";
import { useField } from "formik";

export default function Competency(props) {
  const [compact, setCompact] = useState(true);
  const name = props.name;
  const [field] = useField(props);

  const requiredOptions = [
    {
      key: "required",
      icon: "circle thin",
      color: "green",
      text: "Required",
    },
    {
      key: "recommended",
      icon: "registered",
      color: "yellow",
      text: "Recommended",
    },
    {
      key: "notApplicable",
      icon: "minus",
      color: "grey",
      text: "Not Applicable",
    },
  ];
  const competencyOptions = [
    {
      key: "competent",
      icon: "checkmark",
      color: "green",
      text: "Competent",
    },
    {
      key: "workingUnderSupervision",
      icon: "exclamation",
      color: "yellow",
      text: "Working under supervision",
    },
    {
      key: "notCompetent",
      icon: "x",
      color: "red",
      text: "Not competent",
    },
  ];
  function getOptionbyName(options, name) {
    return options.find((option) => option.key === name);
  }
  const [required, setRequired] = useState(
    field && field.value
      ? getOptionbyName(requiredOptions, field.value.required)
      : null
  );
  const [competency, setCompetency] = useState(
    field && field.value
      ? getOptionbyName(competencyOptions, field.value.competency)
      : null
  );

  function getClassName() {
    if (competency && competency.key == "competent") {
      return "competent";
    }
    if (
      required &&
      competency &&
      required.key == "required" &&
      competency.key != "competent"
    ) {
      return "required-not-competent";
    }
    return "";
  }

  function renderIcons() {
    return (
      <>
        {required && (
          <Icon  name={required.icon} color={required.color} size="large" />
        )}

        {required && competency && required.key != 'notApplicable' && (
          <Icon name={competency.icon} color={competency.color} size="large" />
        )}
      </>
    );
  }
  function renderRequired() {
    return (
      <Menu vertical fluid compact>
        {requiredOptions.map((o) => (
          <Menu.Item key={o.key} >
            <Radio
            style={{whiteSpace: 'nowrap'}}
              label={o.text}
              name={`${name}.required`}
              value={o.key}
              onClick={() => {
                setRequired(o);
                if (o.key == "notApplicable") setCompetency(null);
              }}
            />
          </Menu.Item>
        ))}
      </Menu>
    );
  }
  function renderCompetency() {
    if (required && required.key != "notApplicable")
      return (
        <Menu fluid vertical compact>
          {competencyOptions.map((o) => (
            <Menu.Item key={o.key} >
              <Radio
              style={{whiteSpace: 'nowrap'}}
                label={o.text}
                name={`${name}.competency`}
                value={o.key}
                onClick={() => {
                  setCompetency(o);
                }}
              />
            </Menu.Item>
          ))}
        </Menu>
      );
    else return null;
  }
  const courseDisabled = !required || required.key == 'notApplicable';
  return (
     
      <Grid textAlign="left" stackable>
        <Grid.Column width={1}><Icon name={compact ? "chevron down" : "chevron up"} color="grey" onClick={() => setCompact(!compact)}/></Grid.Column>
        <Grid.Column width={6}>{!compact && renderRequired()}</Grid.Column>
        <Grid.Column width={6}>{!compact && renderCompetency()}</Grid.Column>
        <Grid.Column width={3} verticalAlign="middle">
          {renderIcons()}
        </Grid.Column>
        {
          !compact && 
          <>
            <Grid.Column width={7}>
              <Input
                disabled={courseDisabled}
                inputLabel="Course Name"
                name={`${name}.courseName`}
                size="mini"
              />
            </Grid.Column>
            <Grid.Column width={7}>
              <Input
                disabled={courseDisabled}
                inputLabel="Planned for"
                name={`${name}.plannedFor`}
                size="mini"
              />
            </Grid.Column>
            <Grid.Column width={7}>
              <Input
                disabled={courseDisabled}
                inputLabel="Conducten on date"
                name={`${name}.conductedOn`}
                size="mini"
              />
            </Grid.Column>
            <Grid.Column width={7}>
              <Input
                disabled={courseDisabled}
                inputLabel="Training Provider"
                name={`${name}.trainingProvider`}
                size="mini"
              />
            </Grid.Column>
          </>
        }
      </Grid>

  );
}
