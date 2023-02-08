const noteTemplate = {
  FirstDemo: {
    title: "Generic Form Number Uno",
    sections: [
      {
        title: "First Part",
        fields: [
          {
            name: "reason",
            title: "Reason for attendance",
            type: "email",
          },
          {
            name: "q11",
            title: "This is an info field",
            type: "info",
            description: "Be careful. This section has implications!",
          },
          {
            name: "q12",
            title:
              "A Question - This is a long sentence that needs to fit in the form",
            type: "text",
          },
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
          {
            name: "q250",
            title: "Which fruit do you like?",
            type: "checkbox",
            options: ["Apple", "Orange", "Banana"],
          },

          { name: "q22", title: "XYZ Question", type: "text" },
          { name: "q23", title: "A Question", type: "email" },
        ],
      },
    ],
  },
  PetFile: {
    keyAttributes: ["PetName"],
    title: "Pet Management",
    sections: [
      {
        title: "This is a sectoin with one question only",
        fields: [
          { name: "PetName", title: "What is your pet's name?", type: "text" },
        ],
      },
    ],
  },
  FarhdForm: {
    keyAttributes: ["BridgeName"],
    title: "Concrete Bridge Inspection",
    sections: [
      {
        title: "Bridge",
        fields: [
          {
            name: "BridgeName",
            title: "What was the name of the bridge you visisted?",
            type: "text",
          },
        ],
      },
    ],
  },
  EmployeeSkill: {
    keyAttributes: ["User"],
    title: "Employee Skill Form",
    sections: [
      {
        title: "Skills",
        fields: [
          {
            name: "User",
            title: "Employee",
            type: "text",
          },
          { name: "q1", title: "Data Entry", type: "competency" },
          { name: "q2", title: "Reading", type: "competency" },
          { name: "q3", title: "Writing", type: "competency" },
          { name: "q4", title: "Speaking", type: "competency" },
        ],
      },
    ],
  },
  Tender: {
    title: "Project Tender",
    keyAttributes: ["client"],
    sections: [
      {
        name: "project",
        title: "Project",
        fields: [{ name: "project", title: "Project", type: "text" }],
      },
      {
        name: "tender",
        title: "Tender",
        fields: [
          { name: "client", title: "Client/ Organisation", type: "text" },
          { name: "tenderCode", title: "Tender Code", type: "text" },
          { name: "dollarValue", title: "$ Value", type: "number" },
          { name: "dateSubmitted2", title: "Date Submitted", type: "date" },
          { name: "dateFollowup", title: "Date Follow up", type: "date" },
          {
            name: "status",
            title: "Status",
            type: "radio",
            options: ["Won", "Lost", "-"],
          },
          { name: "notes", title: "Notes", type: "text" },
        ],
      },
    ],
  },
  Contract: {
    title: "Project Contract",
    keyAttributes: ["client"],
    sections: [
      {
        title: "Contract",
        fields: [
          { name: "client", title: "Client/ Organisation", type: "text" },
          { name: "tenderCode", title: "Tender Code", type: "text" },
          { name: "project", title: "Project", type: "text" },
          { name: "dollarValue", title: "$ Value", type: "text" },
          { name: "dateSubmitted", title: "Date Submitted", type: "text" },
          { name: "dateFollowup", title: "Date Follow up", type: "text" },
          {
            name: "status",
            title: "Status",
            type: "radio",
            options: ["Won", "Lost", "-"],
          },
          { name: "notes", title: "Notes", type: "text" },
        ],
      },
    ],
  },
};

export default formConfig;

