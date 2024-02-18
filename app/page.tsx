"use client";

import { useState } from "react";
import { evaluate } from "mathjs";
import parsedQuestions from "@/data/questions.json";
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
  disabled?: boolean;
  displayCondition?: DisplayCondition[];
  formula: string;
  id: string;
  label: string;
  questionText: string;
  relatedVariableName?: string;
  sortKey: string;
  variableName: string;
}

interface Scenario {
  questionId: string;
  currentChoiceId: string;
  newChoiceId: string;
  currentEmissions: number;
  newEmissions: number;
}

type SetQuestionAnswer = (key: string, value: string) => void;
type SetAnswer = (value: string) => void;
type ToggleActMode = () => void;

const constants = parsedConstants as Record<string, number>;
const questions = parsedQuestions as Question[];

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
  const { questionText } = question;

  const setAnswer: SetAnswer = (value) => setQuestionAnswer(question.id, value);

  return (
    <fieldset>
      <legend className="mb-1 font-bold">{questionText}</legend>
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
    <div>
      <h2>Step 1: Calculate your footprint</h2>
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
    </div>
  );
}

function Scenario(props: { scenario: Scenario }) {
  const { scenario } = props;
  const {
    questionId,
    currentChoiceId,
    newChoiceId,
    currentEmissions,
    newEmissions,
  } = scenario;

  const question = questions.find((question) => question.id === questionId);
  const currentChoice = question?.choices.find(
    (choice) => choice.choiceTranslationKey === currentChoiceId,
  );
  const newChoice = question?.choices.find(
    (choice) => choice.choiceTranslationKey === newChoiceId,
  );

  if (!question || !currentChoice || !newChoice) return null;

  const emissionDelta = newEmissions - currentEmissions;
  const emissionDeltaPercent = (emissionDelta / currentEmissions) * 100;

  const formatDelta = (delta: number) => {
    const prefix = delta > 0 ? "+" : "";
    return prefix + delta.toFixed();
  };

  return (
    <dl>
      <dt>Question:</dt>
      <dd>{question.questionText}</dd>
      <dt>From:</dt>
      <dd>{currentChoice.choiceText}</dd>
      <dt>To:</dt>
      <dd>{newChoice.choiceText}</dd>
      <dt>Effect on footprint:</dt>
      <dd>
        {formatDelta(emissionDelta)} kg ({formatDelta(emissionDeltaPercent)} %)
      </dd>
    </dl>
  );
}

function ActionPlanner(props: { scenarios: Scenario[] }) {
  const { scenarios } = props;

  return (
    <div>
      <h2>Step 2: Act!</h2>
      <div className="flex flex-col gap-8">
        {scenarios
          .sort((a, b) => a.newEmissions - b.newEmissions)
          .map((scenario) => (
            <Scenario key={scenario.newChoiceId} scenario={scenario} />
          ))}
      </div>
    </div>
  );
}

function Toolbar({
  emissionsInKg,
  readyToAct,
  actMode,
  toggleActMode,
}: {
  emissionsInKg: number;
  readyToAct: boolean;
  actMode: boolean;
  toggleActMode: ToggleActMode;
}) {
  return (
    <aside className="fixed bottom-0 inset-x-0 bg-white py-2 border-t">
      <div className="max-w-2xl mx-auto px-2 flex justify-between items-center">
        <p>
          Total footprint: <output>{emissionsInKg.toFixed(0)}</output> kg
        </p>
        <button
          className={`btn ${actMode ? "btn-secondary" : "btn-primary"}`}
          type="button"
          disabled={!readyToAct}
          onClick={() => toggleActMode()}
        >
          {actMode ? "Back" : "Step 2: Act"}
        </button>
      </div>
    </aside>
  );
}

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [actMode, setActMode] = useState(false);

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

  const getAssignments = (overrides?: Record<string, string | undefined>) => {
    const assignmentsFromAnswers = Object.entries(answers).reduce<
      Record<string, string>
    >((acc, [questionId, choiceId]) => {
      const question = questions.find(({ id }) => id === questionId);

      if (!question) return acc;

      const { choices, variableName, relatedVariableName } = question;

      const wantedChoiceId = overrides?.[questionId] || choiceId;

      const { choiceValue, relatedVariableValue } = choices.find(
        ({ choiceTranslationKey }) => choiceTranslationKey === wantedChoiceId,
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

    return {
      ...constants,
      ...replacedAssignmentsFromAnswers,
    };
  };

  const assignments = getAssignments();

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

  const availableQuestions = questions.filter(
    ({ disabled, displayCondition }) =>
      !disabled && testDisplayConditions(displayCondition),
  );

  const calculateFootprint = (
    overrides?: Record<string, string | undefined>,
  ) => {
    return availableQuestions.reduce<number>((acc, question) => {
      const overriddenAssignments = getAssignments(overrides);
      const replacedFormula = replaceVariables(
        question.formula,
        overriddenAssignments,
      );

      try {
        return acc + evaluate(replacedFormula);
      } catch (e) {
        return acc;
      }
    }, 0);
  };

  const footprint = calculateFootprint();

  const allAnswered = availableQuestions.every(({ id }) =>
    answers.hasOwnProperty(id),
  );

  const scenarios: Scenario[] = availableQuestions.flatMap((question) => {
    return question.choices
      .filter((choice) => {
        return !Object.values(answers).includes(choice.choiceTranslationKey);
      })
      .map((choice) => {
        const questionId = question.id;
        const newChoiceId = choice.choiceTranslationKey;
        return {
          questionId,
          currentChoiceId: answers[question.id],
          newChoiceId,
          currentEmissions: footprint,
          newEmissions: calculateFootprint({ [question.id]: newChoiceId }),
        };
      });
  });

  return (
    <main>
      <div className="max-w-2xl mx-auto pt-4 pb-16 px-2">
        {actMode ? (
          <ActionPlanner scenarios={scenarios} />
        ) : (
          <Questionnaire
            questions={availableQuestions}
            answers={answers}
            setQuestionAnswer={setQuestionAnswer}
          />
        )}
      </div>
      <Toolbar
        emissionsInKg={footprint}
        readyToAct={allAnswered}
        actMode={actMode}
        toggleActMode={() => setActMode(!actMode)}
      />
    </main>
  );
}
