import NewEmployeeInductionChecklist from "./NewEmployeeInductionChecklist";
import IncidentPart1 from "./IncidentPart1";

const formConfig = {
  NewEmployeeInductionChecklist: {
    component: NewEmployeeInductionChecklist,
    keyAttributes: ["employeeName", "companyHistory"],
  },
  IncidentPart1: {
    component: IncidentPart1,
  }
  // MultiPartExample: {
  //   parts: [
  //     {
  //       component: Part1,
  //       keyAttributes: ["employeeName", "companyHistory"],
  //     },
  //     {
  //       component: Part2,
  //     },
  //   ],
  // },
};

export default formConfig;