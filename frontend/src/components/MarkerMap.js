import React, { useRef, useState } from 'react';

function MarkerMap({ imageUrl }) {
  const imageRef = useRef(null);
  const [markers, setMarkers] = useState([]);

  function handleClick(event) {
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    setMarkers([...markers, { x, y }]);
  }
  function handleReset() {
    setMarkers([]);
  }

  return (
    <div>
      <img
        src={imageUrl}
        alt="Map"
        ref={imageRef}
        onClick={handleClick}
        style={{ cursor: 'crosshair' }}
      />
      {markers.map((marker, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: marker.x,
            top: marker.y,
            width: 10,
            height: 10,
            backgroundColor: 'red',
            borderRadius: '50%',
          }}
        />
      ))}
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

export default MarkerMap;
