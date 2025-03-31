import React, { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

export default function BpmnEditor({ initialDiagram, onChange }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  useEffect(() => {
    // Initialize the modeler without explicit keyboard binding
    const modeler = new BpmnModeler({
      container: containerRef.current
      // Removed keyboard config as it's now implicit
    });
    modelerRef.current = modeler;

    // Load initial diagram or create new one
    if (initialDiagram) {
      modeler.importXML(initialDiagram);
    } else {
      createNewDiagram(modeler);
    }

    // Set up change events
    modeler.on('commandStack.changed', async () => {
      try {
        const { xml } = await modeler.saveXML({ format: true });
        onChange(xml);
      } catch (err) {
        console.error('Error saving BPMN XML:', err);
      }
    });

    return () => {
      modeler.destroy();
    };
  }, []);

  async function createNewDiagram(modeler) {
    const newDiagramXML = `<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                       xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                       id="Definitions_1"
                       targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn:process id="Process_1" isExecutable="false">
          <bpmn:startEvent id="StartEvent_1"/>
        </bpmn:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
              <dc:Bounds x="152" y="102" width="36" height="36"/>
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>`;

    await modeler.importXML(newDiagramXML);
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '600px', 
        border: '1px solid #ccc',
        marginBottom: '20px',
        borderRadius: '4px'
      }} 
    />
  );
} 