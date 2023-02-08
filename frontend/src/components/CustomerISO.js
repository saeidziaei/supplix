import React, { useState } from "react";
import DisplayText from "./DisplayText";
import { Button, Card, Divider, Header, Icon, Item, Label, Segment, Table, Grid, Input } from "semantic-ui-react";
import "./CustomerISO.css";

export default function CustomerISO({ template, params }) {
  const [currentProcess, setCurrentProcess] = useState(null);
  const [currentSubProcess, setCurrentSubProcess] = useState(null);

  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [editableIndex, setEditableIndex] = useState(-1);

  const renderCurrentSubProcess = () => {
    const sp = currentSubProcess;
    const p = sp.parent;
    return (
      <>
        <Segment>
          <Header as="h1" className={`Process ${p.category}`}>
            <DisplayText text={p.title} />
          </Header>
          
            <Header as="h2">
              <DisplayText text={sp.title} />
            </Header>
            {sp.input && (
              <Segment>
                <Header as="h3" className="bg-success text-light">
                  <DisplayText text={sp.input.title || "Input Sources"} />
                </Header>
                <Item>
                  <DisplayText text={sp.input.default} />
                  </Item>
              </Segment>
            )}
            {sp.table && renderTable(sp.table)}
            {sp.output && (
              <Segment>
                <Header as="h3" className="bg-success text-light">
                  <DisplayText text={sp.output.title || "Output Sources"} />
                </Header>
                <Item className="text-left">
                  <DisplayText text={sp.output.default} />
                </Item>
              </Segment>
            )}
        </Segment>

        <Button onClick={() => setCurrentSubProcess(null)}>Back</Button>
      </>
    );
  }
  
  const renderCell = (cell, editable = false) => {
    if (typeof cell === 'string')
      return <DisplayText text={cell} />
    else if (cell.documents)
      return (<div><DisplayText text={cell.title}/>
        Coming Soon</div>)
      return <DisplayText text={cell.title} editable={editable} />
  }

  
  const renderTable = (table) => {
    return (
      <Table striped bordered hover className="my-3">
        <thead>
          <tr>
            <th>#</th>
            {table.cols.map((col, colIndex) => (
              <th key={colIndex}>
                <DisplayText text={col.title} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>{rowIndex + 1}</td>
              {table.cols.map((colRef, colRefIndex) => (
                <td key={colRefIndex}>
                  {renderCell(row[colRef.ref], colRef.editable)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
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
                onClick={() => setCurrentSubProcess({...sub, parent: currentProcess})}
              >
                <Card.Content>
                  <Card.Header>
                    <DisplayText text={sub.title} />
                    <Icon name="tasks" color="teal" />
                  </Card.Header>
                  <Card.Meta>Sub-process</Card.Meta>
                  <Card.Description>
                    
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
        <Divider horizontal>
          <Header as="h2">
            <Icon name="tag" />
            Processes
          </Header>
        </Divider>
        <Item.Group divided>
          {template.processes.map((process, index) => (
            <Item key={index} onMouseEnter={() => setHoveredIndex(index)}>
              {editableIndex != index && (<>
              <Item.Image>
                {index == hoveredIndex && (
                  <Button
                    circular
                    basic
                    icon="pencil"
                    color="green"
                    size="small"
                    onClick={() => setEditableIndex(index)}
                  ></Button>
                )}
              </Item.Image>
              <Item.Content>
                <Item.Header>
                  <DisplayText text={process.title} />
                </Item.Header>
                <Item.Description>paragraph</Item.Description>
                <Item.Extra>
                  <Button
                    basic
                    color="blue"
                    onClick={() => setCurrentProcess(process)}
                  >
                    <Icon color="blue" name="cog" />
                    {`${process.subProcesses.length} Sub-processes`}
                  </Button>
                </Item.Extra>
              </Item.Content>
              </>)}
              {editableIndex == index && (<>
              <Item.Image>

                  <Button circular positive icon="check" color="blue" size="small" onClick={() => setEditableIndex(index)}></Button>
              </Item.Image>
              <Item.Content>
                <Item.Header>
                  <Input value={process.title} />
                </Item.Header>
                <Item.Description>paragraph</Item.Description>
           
              </Item.Content>
              </>)}
            </Item>
          ))}
        </Item.Group>
      </>
    );
  };


  if (currentSubProcess) return renderCurrentSubProcess();
  if (currentProcess) return renderCurrentProcess();
  else return renderHome();
}
