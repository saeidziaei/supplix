import React from "react";
import "./Home.css";
import CustomerISO from "../components/CustomerISO";
import { useAppContext } from "../lib/contextLib";
import MarkerMap from '../components/MarkerMap';

const template = {
  processes: [
    {
      category: "Plan",
      title: "Business Management and **Planning**",
      subProcesses: [
        {
          title: "Strategic Planning",
          input: {
            title: "Input Sources",
            placeholder: "List of all sources",
            default:
              "* All IMS processes \n * Clients \n  * Authorities & regulatory bodies",
          },
          table: {
            cols: [
              { ref: "activity", title: "Activity" },
              { ref: "documentation", title: "Documentation", editable: true },
              {
                ref: "responsibility",
                title: "Responsibility",
                editable: true,
              },
            ],
            rows: [
              {
                activity: "Business *planning*",
                documentation: {
                  title: "A bunch of documents",
                  documents: [
                    {
                      ref: "XXX-MAN-001-XXX-MAN-001-Management System Manual (section 1 & 3)",
                    },
                    { ref: "XXX-FOR-001-Business Development Plan" },
                  ],
                },
                responsibility: { title: "Managing Director" },
              },
              {
                activity: "Establish/Maintain IMS and relevant policies",
                documentation: {},
                responsibility: { default: "Managing Director" },
              },
            ],
          },
          output: {
            placeholder: "List of all outputs",
            default:
              "* All IMS processes \n * Clients \n  * Authorities & regulatory bodies",
          },
        },
        {
          title: "Management Review",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Change Management",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Communication",
        },
      ],
    },
    {
      category: "Plan",
      title: "Support",
      subProcesses: [
        {
          title: "Test",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Human Resources",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Competency and Awareness",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
      ],
    },
    {
      category: "Do",
      title: "Operations",
      subProcesses: [
        {
          title: "Marketing",
        },
        {
          title: "Sales",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Exernal vendor evaluation",
          input: {
            placeholder: "List of all sources",
          },
          output: {
            placeholder: "List of all outputs",
          },
        },
        {
          title: "Producrement ...",
        },
      ],
    },
    {
      category: "Check",
      title: "Performance Evaluation",
      subProcesses: [
        {
          title: "Internal Audit",
        },
        {
          title: "Monitoring & evaluation",
        },
      ],
    },
    {
      category: "Act",
      title: "Continous Improvement",
      subProcesses: [
        {
          title: "Non-Conformance",
        },
        {
          title: "Corrective Actions",
        },
      ],
    },
  ],
  files: [
    {
      ref: "XXX-MAN-001-XXX-MAN-001-Management System Manual (section 1 & 3)",
      title:
        "[[!COMP_NAME!]]-MAN-001-[[!COMP_NAME!]]-MAN-001-Management System Manual (section 1 & 3)",
    },
    {
      ref: "XXX-FOR-001-Business Development Plan",
      ref: "[[!COMP_NAME!]]-FOR-001-Business Development Plan",
    },
   
  ],
};

const params = {
  COMP_NAME: "Tesla"
};




export default function Home() {
  // const { isTopLevelAdmin } = useAppContext();

  return (
    <div className="Home">
      <MarkerMap imageUrl="https://i.pinimg.com/564x/55/fb/60/55fb60c012d409c0f04e39bf8c332644.jpg" />
      <CustomerISO template={ template } params={ params } /> 
    </div>
  );
}
