"use client";

import { useState } from "react";
import questions from "@/data/questions.json";

interface Choice {
  choiceText: string;
  choiceTranslationKey: string;
  choiceValue: number | string;
}

interface Question {
  choices: Choice[];
  formula: string;
  id: string;
  label: string;
  questionText: string;
  sortKey: string;
  variableName: string;
}

type SetQuestionAnswer = (key: string, value: string) => void;

type SetAnswer = (value: string) => void;

function Choice(props: {
  choice: Choice;
  checked: boolean;
  setAnswer: SetAnswer;
}) {
  const { choice, checked, setAnswer } = props;
  const { choiceText, choiceTranslationKey } = choice;

  return (
    <label className="flex gap-2 items-center">
      <input
        type="radio"
        checked={checked}
        onChange={() => setAnswer(choiceTranslationKey)}
      />
      {choiceText}
    </label>
  );
}

function Question(props: {
  question: Question;
  answer?: string;
  setQuestionAnswer: SetQuestionAnswer;
}) {
  const { question, answer, setQuestionAnswer } = props;
  const { questionText } = question;

  const setAnswer: SetAnswer = (value) => setQuestionAnswer(question.id, value);

  return (
    <fieldset>
      <legend className="mb-1">{questionText}</legend>
      {question.choices.map((choice) => (
        <Choice
          key={choice.choiceTranslationKey}
          choice={choice}
          checked={choice.choiceTranslationKey === answer}
          setAnswer={setAnswer}
        />
      ))}
    </fieldset>
  );
}

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setQuestionAnswer: SetQuestionAnswer = (key, value) =>
    setAnswers((a) => ({
      ...a,
      [key]: value,
    }));

  return (
    <form className="max-w-3xl mx-auto flex flex-col gap-8">
      {questions.map((question) => (
        <Question
          key={question.id}
          question={question}
          answer={answers[question.id]}
          setQuestionAnswer={setQuestionAnswer}
        />
      ))}
    </form>
  );
}
