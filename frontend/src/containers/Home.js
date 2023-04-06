// Import React dependencies.
import React, { useState } from "react";
import { Header, Icon, Input, Segment, TextArea } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import "./Home.css";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";

export default function Home() {

  const [rowData] = useState([
    { make: "Toyota", model: "Celica", price: 35000 },
    { make: "Ford", model: "Mondeo", price: 32000 },
    { make: "Porsche", model: "Boxster", price: 72000 },
  ]);

  const [columnDefs] = useState([
    { field: "make", resizable: true, filter: true, sortable: true },
    { field: "model", resizable: true, filter: true, sortable: true },
    { field: "price", filter: true, sortable: true },
  ]);

  return (
    <div className="Home">
      <FormHeader heading="Home" />
      <div
        className="ag-theme-alpine"
        style={{
          height: "500px",
          width: "600px",
        }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          rowHeight="25"
          onColumnResized={(e) => console.log(columnDefs)}
          onColumnMoved={(e) => console.log(e)}
          animateRows={true}
        ></AgGridReact>
      </div>
      <Segment placeholder>
        <Header icon>
          <Icon name="smile outline" />
          Welcome!
        </Header>
      </Segment>
    </div>
  );
}
