// Import React dependencies.
import React, { useState } from "react";
import { Header, Icon, Input, Segment, TextArea } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import "./Home.css";


import { AgGridReact } from '@ag-grid-community/react';
import { ModuleRegistry } from '@ag-grid-community/core';
    import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
    import '@ag-grid-community/styles/ag-grid.css';
    import '@ag-grid-community/styles/ag-theme-alpine.css';

export default function Home() {
    ModuleRegistry.registerModules([ ClientSideRowModelModule ]);

  const [rowData] = useState([
    {make: "Toyota", model: "Celica", price: 35000},
    {make: "Ford", model: "Mondeo", price: 32000},
    {make: "Porsche", model: "Boxster", price: 72000}
]); 

const [columnDefs] = useState([
    { field: 'make', resizable: true, filter: true, sortable: true  },
    { field: 'model', resizable: true, filter: true, sortable: true  }, 
    { field: 'price', filter: true, sortable: true }
])

  return (
    <div className="Home">
      <FormHeader heading="Home" />
      {/* <div
        className="ag-theme-alpine"
        style={{
          height: "500px",
          width: "600px",
        }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          onColumnResized={(e) => console.log(columnDefs)}
          onColumnMoved={(e) => console.log(e)}
        ></AgGridReact>
      </div> */}
      <Segment placeholder>
        <Header icon>
          <Icon name="smile outline" />
          Welcome!
        </Header>
      </Segment>
    </div>
  );
}
