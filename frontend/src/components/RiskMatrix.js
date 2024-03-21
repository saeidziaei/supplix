import React, { useEffect, useState } from 'react';
import { Button, Header, Icon, Modal, ModalActions, ModalContent, ModalDescription, ModalHeader } from "semantic-ui-react";
import './RiskMatrix.css';

const RiskMatrix = ({value, disabled, onChange}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    const parseInput = (input) => {
      const values = input.split(",");

      const row = parseInt(values[0]);
      const column = parseInt(values[1]);

      return row == -1 ? null : { row, column };
    };
    if (value) setSelectedCell(parseInput(value));
  }, [value]);

  const handleCellClick = (row, column) => {
    if (row == -1) setSelectedCell(null);
    else setSelectedCell({ row, column });

    setShowMatrix(false);

    if (onChange) {
      onChange(`${row},${column}`);
    }
  };
  const rows = ['Catastrophic', 'Major', 'Moderate', 'Minor'];
  const columns = ['Very Likely', 'Likely', 'Unlikely', 'Very Unlikely'];

  const getSelectedCellInfo = () => {
    if (!selectedCell) return {color: "black", rating: "-"};

    
    return getCellInfo(rows[selectedCell.row], selectedCell.column);
  }


  const getCellInfo = (row, colIdx) => {
    const colors = {
      'Catastrophic': ['#ff0000', '#ff0000', '#ffc000', '#ffff00'],
      'Major':        ['#ff0000', '#ffc000', '#ffff00', '#92d050'],
      'Moderate':     ['#ffc000', '#ffff00', '#92d050', '#00b050'],
      'Minor':        ['#ffff00', '#92d050', '#00b050', '#00b050']
    };
    const ratings = {
      'Catastrophic': [1, 1, 2, 3],
      'Major':        [1, 2, 3, 4],
      'Moderate':     [2, 3, 4, 5],
      'Minor':        [3, 4, 5, 6],
    };

    return { rating: ratings[row][colIdx], color: colors[row][colIdx] };
  };

  const renderMatrix = () => {

    return (
      <table className="risk-matrix">
        <thead>
          <tr>
            <th></th>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>{row}</td>
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={selectedCell && selectedCell.row === rowIndex && selectedCell.column === colIndex ? 'selected' : 'clickable'}
                  style={{ backgroundColor: getCellInfo(row, colIndex).color }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >{getCellInfo(row, colIndex).rating}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="risk-matrix-container">
      {selectedCell && (
        <div className={`selected-cell ${disabled ? "" : "clickable"}`}  style={{ backgroundColor: getSelectedCellInfo().color }} onClick={() => setShowMatrix(!disabled && !showMatrix)} >
          {getSelectedCellInfo().rating} - {rows[selectedCell.row]} - {columns[selectedCell.column]}
        </div>
      ) }
      
       {!disabled && !selectedCell && (<Icon fitted name='chevron down' className='clickable' onClick={() => setShowMatrix(true)} />)  } 
      { !disabled && showMatrix && renderMatrix()}
      
      <Modal
      onClose={() => setShowMatrix(false)}
      onOpen={() => setShowMatrix(true)}
      open={showMatrix}
     
    >
      <ModalHeader>Risk Matrix</ModalHeader>
      <ModalContent>
        <ModalDescription>

          <Header>Select applicable risk rating</Header>
          {renderMatrix()}
          <br/>
          <p>
          A risk matrix is a matrix that is used during risk assessment to define the level of risk by considering the category of probability or likelihood against the category of consequence severity. This is a simple mechanism to increase visibility of risks and assist management decision making.
          </p>
        </ModalDescription>
        
      </ModalContent>
      <ModalActions>
      
        <Button size='tiny' basic floated='left' icon="delete" onClick={() => handleCellClick(-1, -1)}>Clear</Button>
        <Button size='tiny' color='black' basic onClick={() => setShowMatrix(false)}>
          Close
        </Button>
      </ModalActions>
    </Modal>
    </div>
  );
};

export default RiskMatrix;
