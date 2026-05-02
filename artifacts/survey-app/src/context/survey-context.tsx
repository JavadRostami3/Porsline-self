import { createContext, useContext, useState, type ReactNode } from "react";

export interface Demographics {
  fullName: string;
  age: number;
  competitionAgeGroup: string;
  gender: string;
  height: number;
  weight: number;
  city: string;
  maritalStatus: string;
  sport: string;
  nationalTeamHistory: string;
  premierLeagueHistory: string;
  firstLeagueHistory: string;
  yearsOfExperience: number;
  injuryHistory: string;
  timeSinceLastInjury?: string;
  physiotherapyTreatment: string;
  surgerHistory: string;
  injuryDetails?: string;
}

export interface SurveyState {
  currentStep: number; // 0=demographics, 1-7=questionnaires
  demographics: Demographics | null;
  questionnaire1: number[]; // 12 questions
  questionnaire2: number[]; // 11 questions
  questionnaire3: number[]; // 6 questions
  questionnaire4: number[]; // 15 questions
  questionnaire5: number[]; // 14 questions
  questionnaire6: number[]; // 32 questions
  questionnaire7: number[]; // 30 questions
}

interface SurveyContextType {
  state: SurveyState;
  setDemographics: (d: Demographics) => void;
  setQuestionnaireAnswers: (q: number, answers: number[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState: SurveyState = {
  currentStep: 0,
  demographics: null,
  questionnaire1: [],
  questionnaire2: [],
  questionnaire3: [],
  questionnaire4: [],
  questionnaire5: [],
  questionnaire6: [],
  questionnaire7: [],
};

const SurveyContext = createContext<SurveyContextType | null>(null);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SurveyState>(initialState);

  const setDemographics = (d: Demographics) =>
    setState((s) => ({ ...s, demographics: d }));

  const setQuestionnaireAnswers = (q: number, answers: number[]) =>
    setState((s) => ({ ...s, [`questionnaire${q}`]: answers }));

  const nextStep = () =>
    setState((s) => ({ ...s, currentStep: Math.min(s.currentStep + 1, 7) }));

  const prevStep = () =>
    setState((s) => ({ ...s, currentStep: Math.max(s.currentStep - 1, 0) }));

  const reset = () => setState(initialState);

  return (
    <SurveyContext.Provider
      value={{ state, setDemographics, setQuestionnaireAnswers, nextStep, prevStep, reset }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider");
  return ctx;
}
