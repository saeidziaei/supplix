// import React, { useState } from 'react';
// import Card from 'react-bootstrap/Card';
// import Col from 'react-bootstrap/Col';
// import Row from 'react-bootstrap/Row';
// import Stack from 'react-bootstrap/Stack';
// import Button from "react-bootstrap/Button";
// import DisplayText from './DisplayText';
// import Table from 'react-bootstrap/Table'
// import "./CustomerISO.css";

// export default function CustomerISO({template, params}) {
//   const [currentSubProcess, setCurrentSubProcess] = useState(null);

//   const renderHome = () => {

//     return (
//       <Row xs={1} md={3} className="g-4">

//         {template.processes.map((process, index) => (
//           <Col key={index}>
//             <Card className="text-center">
//               <Card.Header className={`Process ${process.category}`}>
//                 <DisplayText text={process.title}/>
//               </Card.Header>
//               <Card.Body>
//                 <Stack gap={3}>
//                   {process.subProcesses.map((subProcess, indexp) => (
//                     <Card key={indexp} onClick={() => setCurrentSubProcess({...subProcess, parent: process})} style={{ cursor: "pointer" }}>
//                       <Card.Body>{subProcess.title}</Card.Body>
//                     </Card>
//                   ))}
//                 </Stack>
//               </Card.Body>
//             </Card>
//           </Col>
//         ))}
//       </Row>
//     );
//   }

//   const renderSubProcess = (sp) => {
//     return (
//       <>
//         <Card>
//           <Card.Header className={`Process ${sp.parent.category}`}>
//             <DisplayText text={sp.parent.title} />
//           </Card.Header>
//           <Card.Body>
//             <Card.Title>
//               <DisplayText text={sp.title} />
//             </Card.Title>
//             {sp.input && (
//               <Card>
//                 <Card.Header className="bg-success text-light">
//                   <DisplayText text={sp.input.title || "Input Sources"} />
//                 </Card.Header>
//                 <Card.Body>
//                   <DisplayText text={sp.input.default} />
//                 </Card.Body>
//               </Card>
//             )}
//             {sp.table && renderTable(sp.table)}
//             {sp.output && (
//               <Card>
//                 <Card.Header className="bg-success text-light">
//                   <DisplayText text={sp.output.title || "Output Sources"} />
//                 </Card.Header>
//                 <Card.Body className="text-left">
//                   <DisplayText text={sp.output.default} />
//                 </Card.Body>
//               </Card>
//             )}{" "}
//           </Card.Body>
//         </Card>
//         <Button className="my-3" onClick={() => setCurrentSubProcess(null)}>
//           Home
//         </Button>
//       </>
//     );
//   }
//   const renderTable = (table) => {
//     return <Table striped bordered hover className="my-3">
//       <thead>
//         <tr>
//           <th>#</th>
//           {table.cols.map((col, colIndex) => (
//             <th key={colIndex}>
//               <DisplayText text={col.title} />
//             </th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {table.rows.map((row, rowIndex) => (
//           <tr key={rowIndex}>
//             <td>{rowIndex + 1}</td>
//             {table.cols.map((colRef, colRefIndex) => (
//               <td key={colRefIndex}>
//                 { renderCell(row[colRef.ref], colRef.editable) }
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </Table>;
//   }

//   const renderCell = (cell, editable = false) => {
//     if (typeof cell === 'string')
//       return <DisplayText text={cell} />
//     else if (cell.documents)
//       return (<div><DisplayText text={cell.title}/>
//         Coming Soon</div>)
//       return <DisplayText text={cell.title} editable={editable} />
//   }

//   return currentSubProcess ? renderSubProcess(currentSubProcess) : renderHome();
// }

import React, { useState } from "react";
import DisplayText from "./DisplayText";
import { Button, Card, Icon, Segment } from "semantic-ui-react";
import "./CustomerISO.css";

export default function CustomerISO({ template, params }) {
  const [currentProcess, setCurrentProcess] = useState(null);
  const [currentSubProcess, setCurrentSubProcess] = useState(null);

  const renderCurrentProcess = () => {
    return (
      <>
        <h2>Process: {currentProcess.title}</h2>
        <h3 className="text-mute">Sub processes</h3>
        <Segment style={{backgroundColor: "#242350"}}>
          <Card.Group itemsPerRow="2">
            {currentProcess.subProcesses.map((sub, index) => (
              <Card
              
                color="blue"
                key={index}
                href="#"
                onClick={() => setCurrentSubProcess(sub)}
              >
                <Card.Content>
                  <Card.Header>
                    <DisplayText text={sub.title} />
                    <Icon name="tasks" color="teal" />
                  </Card.Header>
                  <Card.Meta>Sub-process</Card.Meta>
                  <Card.Description>
                    Elliot is a sound engineer living in Nashville who enjoys
                    playing guitar and hanging with his cat.
                  </Card.Description>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Segment>
        <Button primary onClick={() => setCurrentProcess(null)}>
          <Icon name="arrow alternate circle left" size="large" />{" "}
        </Button>
      </>
    );
  };
  // const renderTable = (table) => {
  //   return (
  //     <Table striped bordered hover className="my-3">
  //       <thead>
  //         <tr>
  //           <th>#</th>
  //           {table.cols.map((col, colIndex) => (
  //             <th key={colIndex}>
  //               <DisplayText text={col.title} />
  //             </th>
  //           ))}
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {table.rows.map((row, rowIndex) => (
  //           <tr key={rowIndex}>
  //             <td>{rowIndex + 1}</td>
  //             {table.cols.map((colRef, colRefIndex) => (
  //               <td key={colRefIndex}>
  //                 {renderCell(row[colRef.ref], colRef.editable)}
  //               </td>
  //             ))}
  //           </tr>
  //         ))}
  //       </tbody>
  //     </Table>
  //   );
  // };
  // const renderSubProcess = () => {
  //   const sp = currentSubProcess;
  //   return (
  //     <>
  //       <Card>
  //         <Card.Header className={`Process ${sp.parent.category}`}>
  //           <DisplayText text={sp.parent.title} />
  //         </Card.Header>
  //         <Card.Body>
  //           <Card.Title>
  //             <DisplayText text={sp.title} />
  //           </Card.Title>
  //           {sp.input && (
  //             <Card>
  //               <Card.Header className="bg-success text-light">
  //                 <DisplayText text={sp.input.title || "Input Sources"} />
  //               </Card.Header>
  //               <Card.Body>
  //                 <DisplayText text={sp.input.default} />
  //               </Card.Body>
  //             </Card>
  //           )}
  //           {sp.table && renderTable(sp.table)}
  //           {sp.output && (
  //             <Card>
  //               <Card.Header className="bg-success text-light">
  //                 <DisplayText text={sp.output.title || "Output Sources"} />
  //               </Card.Header>
  //               <Card.Body className="text-left">
  //                 <DisplayText text={sp.output.default} />
  //               </Card.Body>
  //             </Card>
  //           )}{" "}
  //         </Card.Body>
  //       </Card>
  //       <Button className="my-3" onClick={() => setCurrentSubProcess(null)}>
  //         Home
  //       </Button>
  //     </>
  //   );
  // };
  const renderHome = () => {
    return (
      <>
      <h1>Processes</h1>
      <Segment padded style={{backgroundColor: "#242350"}}>
        <Card.Group itemsPerRow="2">
          {template.processes.map((process, index) => (
            <Card
            
              color="teal"
              key={index}
              href="#"
              onClick={() => setCurrentProcess(process)}
            >
              <Card.Content>
                <Card.Header>
                  <DisplayText text={process.title} />
                  <Icon name="clipboard list" color="blue"/>
                </Card.Header>
                <Card.Meta>
                  {`${process.subProcesses.length} Sub-processes`}
                </Card.Meta>
                <Card.Description>
                  Elliot is a sound engineer living in Nashville who enjoys
                  playing guitar and hanging with his cat.
                </Card.Description>
              </Card.Content>
            </Card>
          ))}
        </Card.Group>
      </Segment></>
    );
  };

  if (currentProcess) return renderCurrentProcess();
  // if (currentSubProcess) return renderSubProcess();
  else return renderHome();
}
