const formConfig = {
  FirstDemoForm: {
    keyAttributes: ["q1", "q12"],
    title: "Generic Form Number Uno",
    sections: [
      {
        title: "First Part",
        fields: [
          {
            name: "q1",
            title: "This is to show the type email",
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
    keyAttributes: ["PetName", ],
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
};

export default formConfig;

