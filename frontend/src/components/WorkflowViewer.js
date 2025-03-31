import React from 'react';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

export default function WorkflowViewer({ xml }) {
  const containerRef = React.useRef(null);
  const viewerRef = React.useRef(null);

  React.useEffect(() => {
    const viewer = new BpmnViewer({
      container: containerRef.current
    });
    viewerRef.current = viewer;

    if (xml) {
      viewer.importXML(xml);
    }

    return () => {
      viewer.destroy();
    };
  }, [xml]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '400px', 
        border: '1px solid #eee',
        borderRadius: '4px'
      }} 
    />
  );
} 