import React from "react";
import "./Home.css";
import CustomerISO from "../components/CustomerISO";
import Tree from "../components/Tree";

const template = {
  processes: [
    {
      category: "Plan",
      title: "Business Management and **Planning**",
      subProcesses: [
        {
          title: "Strategic Planning 2 - see [Employee Form](http://localhost:3000/template/16d7bfd0-a4d9-11ed-a505-09d7d7d3c8a3)",
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
      title: "Continuous Improvement",
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
      title: "[[!COMP_NAME!]]-FOR-001-Business Development Plan",
    },
   
  ],
};

const params = {
  COMP_NAME: "Tesla"
};


const data = {
  guid: "0",
  title: 'Top level',
  content: 'top level text',
  type: '-',
  children: [
    { guid: "1", title: 'Process One Title', content: 'P 1', type:'process',
      children: [
        { guid: "11", title: 'Subprocess 1.1', content: 'This is a sub process', type:'sub-process' },    
        { guid: "12", title: 'Subprocess 1.2', content: 'This is another one', type:'sub-process' },    
      ]
     },
    { guid: "2", title: 'Child Two Title', content: 'P 2', type:'process' },
    { guid: "3", title: 'Child Three Title', content: 'M 1', type:'manual' },

  ]
}

export default function ISO() {
  

  return (
    <div className="Home">
      {/* <CustomerISO template={ template } params={ params } />  */}
      <Tree data={data}  onSave={(d) => console.log("save this", d)} />
    </div>
  );
}
