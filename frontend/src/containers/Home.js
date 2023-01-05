import React from "react";
import "./Home.css";
import Wizard from "../components/Wizard";
import { useAppContext } from "../lib/contextLib";

const questions = [
  [
    {
      id: '1',
      type: 'free-text',
      prompt: 'What is your name?'
    },
    {
      id: '2',
      type: 'choice',
      prompt: 'What is your favorite animal?',
      choices: ['Cat', 'Dog', 'Fish']
    }
  ],
  [
    {
      id: '3',
      type: 'choice',
      prompt: 'What is your favorite color?',
      choices: ['Red', 'Green', 'Blue']
    },
    {
      id: '4',
      type: 'free-text',
      prompt: 'What is your email address?'
    }
  ],
  [
    {
      id: '5',
      type: 'choice',
      prompt: 'What is your favorite holiday?',
      choices: ['Christmas', 'Easter', 'Labour Day']
    },
  ]
];



export default function Home() {
  const { isTopLevelAdmin } = useAppContext();

  return (
    <div className="Home">
      <div className="lander">
        <h1>ISO Cloud {isTopLevelAdmin ? " Top" : " Buttom"} </h1> 
        <p className="text-muted">ISO the Right Way</p>
        <Wizard questions={questions} />

      </div>
    </div>
  );
}
