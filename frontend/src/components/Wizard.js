import React, { useState } from 'react';

export default function Wizard({questions}) { // questions is an array of arrays
  const [currentPage, setCurrentPage] = useState(0);
  // const [answers, setAnswers] = useState([['', ''], ['', '']]);
  const [answers, setAnswers] = useState(() => {
    // initialise empty answers array of arrays
    let ret = new Array(questions.length);

    questions.forEach((q, index) => {
        ret[index] = new Array(q.length);
    });

    return ret;
  });

  const handleAnswerChange = (event, currentPage, questionIndex) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentPage][questionIndex] = event.target.value;
    setAnswers(updatedAnswers);
  }


  const handleBackButton = () => {
    setCurrentPage(currentPage - 1);
  }

  const handleNextButton = () => {
    setCurrentPage(currentPage + 1);
  }

  const renderQuestions = () => {
    const pageQuestions = questions[currentPage];
    return pageQuestions.map((question, index) => {
      if (question.type === 'free-text') {
        return (
          <div key={index}>
            <label>{question.prompt}</label>
            <input type="text" onChange={(event) => handleAnswerChange(event, currentPage, index)} value={answers[currentPage][index] || ''} />
          </div>
        );
      } else if (question.type === 'choice') {
        return (
          <div key={index}>
            <label>{question.prompt}</label>
            {question.choices.map((choice) => (
              <div key={choice}>
                <input type="radio" value={choice} checked={answers[currentPage][index] === choice} onChange={(event) => handleAnswerChange(event, currentPage, index)} />
                {choice}
              </div>
            ))}
          </div>
        );
      }
      return <div key={index}>Unknown question type</div>
    });
  }

  return (
    <div>
      {renderQuestions()}
      {currentPage > 0 && <button onClick={handleBackButton}>Back</button>}
      {currentPage < questions.length - 1 && <button onClick={handleNextButton}>Next</button>}
    </div>
  );
}


