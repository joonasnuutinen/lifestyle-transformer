"use client";

import { useState } from "react";
import { evaluate } from "mathjs";
import questions from "@/data/questions.json";
import parsedConstants from "@/data/constants.json";

interface Choice {
  choiceText: string;
  choiceTranslationKey: string;
  choiceValue: number | string;
  relatedVariableValue?: number | string;
}

interface DisplayCondition {
  operator: string;
  value: string;
  variableName: string;
}

interface Question {
  choices: Choice[];
  displayCondition?: DisplayCondition[];
  formula: string;
  id: string;
  label: string;
  questionText: string;
  relatedVariableName?: string;
  sortKey: string;
  variableName: string;
}

type SetQuestionAnswer = (key: string, value: string) => void;
type SetAnswer = (value: string) => void;

const constants = parsedConstants as Record<string, number>;

function Choice(props: {
  choice: Choice;
  checked: boolean;
  setAnswer: SetAnswer;
}) {
  const { choice, checked, setAnswer } = props;
  const { choiceText, choiceTranslationKey } = choice;

  return (
    <label className="flex gap-2 items-start">
      <input
        className="mt-1.5"
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
  const { questionText, displayCondition } = question;

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

function Toolbar({
  emissionsInKg,
  readyToAct,
}: {
  emissionsInKg: number;
  readyToAct: boolean;
}) {
  return (
    <aside className="fixed bottom-0 inset-x-0 bg-white py-2 border-t">
      <div className="max-w-2xl mx-auto px-2 flex justify-between items-center">
        <p>
          Total footprint: <output>{emissionsInKg.toFixed(0)}</output> kg
        </p>
        <button
          className="btn btn-primary"
          type="button"
          disabled={!readyToAct}
        >
          Act
        </button>
      </div>
    </aside>
  );
}

function Questionnaire({
  questions,
  answers,
  setQuestionAnswer,
}: {
  questions: Question[];
  answers: Record<string, string>;
  setQuestionAnswer: SetQuestionAnswer;
}) {
  return (
    <form className="flex flex-col gap-8">
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

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setQuestionAnswer: SetQuestionAnswer = (key, value) =>
    setAnswers((a) => ({
      ...a,
      [key]: value,
    }));

  const replaceVariables = (
    formula: string,
    assignments: Record<string, number | string>,
  ) =>
    formula.replaceAll(/[A-Z]+[A-Z0-9_]*/g, (variableName) =>
      assignments.hasOwnProperty(variableName)
        ? `${assignments[variableName]}`
        : variableName,
    );

  const assignmentsFromAnswers = Object.entries(answers).reduce<
    Record<string, string>
  >((acc, [questionId, choiceId]) => {
    const question = questions.find(({ id }) => id === questionId);

    if (!question) return acc;

    const { choices, variableName, relatedVariableName } = question;

    const { choiceValue, relatedVariableValue } = choices.find(
      ({ choiceTranslationKey }) => choiceTranslationKey === choiceId,
    ) as Choice;

    const relatedVariableAssignment =
      relatedVariableName && relatedVariableValue !== undefined
        ? {
            [relatedVariableName]: replaceVariables(
              relatedVariableValue.toString(),
              constants,
            ),
          }
        : {};

    return {
      ...acc,
      [variableName]: replaceVariables(choiceValue.toString(), constants),
      ...relatedVariableAssignment,
    };
  }, {});

  // By now, constants have been replaced. However, there might be variables referencing to values set by other assignments
  // so replace them, too.
  const replacedAssignmentsFromAnswers = Object.fromEntries(
    Object.entries(assignmentsFromAnswers).map(([variableName, value]) => {
      return [variableName, replaceVariables(value, assignmentsFromAnswers)];
    }),
  );

  const assignments = {
    ...constants,
    ...replacedAssignmentsFromAnswers,
  };

  const testDisplayConditions = (displayConditions?: DisplayCondition[]) => {
    if (!displayConditions) return true;

    return displayConditions.every(({ variableName, operator, value }) => {
      const formula = replaceVariables(
        `${variableName} ${operator.replace(/[!=]==/, (op) => op.substring(0, 2))} ${value}`,
        assignments,
      );

      try {
        return evaluate(formula);
      } catch (e) {
        return false;
      }
    });
  };

  const availableQuestions = questions.filter(({ displayCondition }) =>
    testDisplayConditions(displayCondition),
  );

  const emissionsInKg = availableQuestions.reduce<number>(
    (acc, { formula }, i) => {
      const replacedFormula = replaceVariables(formula, assignments);

      try {
        return acc + evaluate(replacedFormula);
      } catch (e) {
        return acc;
      }
    },
    0,
  );

  const allAnswered = availableQuestions.every(({ id }) =>
    answers.hasOwnProperty(id),
  );

  return (
    <main>
      <div className="max-w-2xl mx-auto pt-4 pb-16 px-2">
        <Questionnaire
          questions={availableQuestions}
          answers={answers}
          setQuestionAnswer={setQuestionAnswer}
        />
      </div>
      <Toolbar emissionsInKg={emissionsInKg} readyToAct={allAnswered} />
    </main>
  );
}
