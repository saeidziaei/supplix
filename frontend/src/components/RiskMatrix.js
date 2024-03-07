import React, { useState } from 'react';
// import './RiskMatrix.css';

const RiskMatrix = () => {
  const [selectedCell, setSelectedCell] = useState(null);

  const handleCellClick = (row, column) => {
    setSelectedCell({ row, column });
  };

  const getCellColor = (row, column) => {
    const colors = {
      'Catastrophic': ['#ff0000', '#ff0000', '#ffc000', '#ffff00'],
      'Major': ['#ff0000', '#ffc000', '#ffff00', '#92d050'],
      'Moderate': ['#ffc000', '#ffff00', '#92d050', '#00b050'],
      'Minor': ['#ffff00', '#92d050', '#00b050', '#00b050']
    };

    return colors[row][column];
  };
  const rows = ['Catastrophic', 'Major', 'Moderate', 'Minor'];
  const columns = ['Very Likely', 'Likely', 'Unlikely', 'Very Unlikely'];

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
                  className={selectedCell && selectedCell.row === rowIndex && selectedCell.column === colIndex ? 'selected' : ''}
                  style={{ backgroundColor: getCellColor(row, colIndex) }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                ></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="risk-matrix-container">
      {selectedCell ? (
        <div className="selected-cell">
          <span>Selected cell: {rows[selectedCell.row]} - {columns[selectedCell.column]}</span>
          <button onClick={() => setSelectedCell(null)}>Close</button>
        </div>
      ) : (
        renderMatrix()
      )}
    </div>
  );
};

export default RiskMatrix;
