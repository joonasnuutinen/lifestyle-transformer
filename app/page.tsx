"use client";

import { useState, Dispatch } from "react";
import parsedQuestions from "@/data/questions.json";

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

function Choice(props: {
  choice: Choice;
  checked: boolean;
  setChecked: Dispatch<string | null>;
}) {
  const { choice, checked, setChecked } = props;
  const { choiceText, choiceTranslationKey } = choice;

  return (
    <label className="flex gap-2 items-center">
      <input
        type="radio"
        checked={checked}
        onChange={() => setChecked(choiceTranslationKey)}
      />
      {choiceText}
    </label>
  );
}

function Question(props: { question: Question }) {
  const { question } = props;
  const { questionText } = question;
  const [checkedChoiceKey, setCheckedChoiceKey] = useState<string | null>(null);

  return (
    <fieldset>
      <legend className="mb-1">{questionText}</legend>
      {question.choices.map((choice) => (
        <Choice
          key={choice.choiceTranslationKey}
          choice={choice}
          checked={choice.choiceTranslationKey === checkedChoiceKey}
          setChecked={setCheckedChoiceKey}
        />
      ))}
    </fieldset>
  );
}

export default function Home() {
  return (
    <form className="max-w-3xl mx-auto flex flex-col gap-8">
      {parsedQuestions.map((question) => (
        <Question key={question.id} question={question} />
      ))}
    </form>
  );
}
