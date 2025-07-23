import React, { useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";

const SurveyViewer = ({ surveyJson, onSubmit, formData = {}, disabled, resetSignal }) => {
  const [model, setModel] = useState(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const modelInstance = new Model(surveyJson);
    modelInstance.readOnly = disabled;
    modelInstance.data = formData || {};

    modelInstance.onComplete.add((sender) => {
      onSubmit(sender.data);
    });

    modelRef.current = modelInstance;
    setModel(modelInstance);
  }, [surveyJson]);

  // Handle reset when signal changes
  useEffect(() => {
    if (resetSignal && modelRef.current) {
      modelRef.current.data = formData || {};
    }
  }, [resetSignal]);

  // 🔧 Update readOnly when `disabled` changes
useEffect(() => {
  if (modelRef.current) {
    modelRef.current.readOnly = disabled;
  }
}, [disabled]);

  return model ? <Survey model={model} /> : <div>Loading...</div>;
};

export default SurveyViewer;
