import { create } from 'zustand';
import { Question, RoundAnswer, QuizLevel } from '@/lib/types';

interface QuizState {
  currentLevel: QuizLevel;
  questions: Question[];
  currentQuestionIndex: number;
  answers: RoundAnswer[];
  roundStartTime: Date | null;
  setCurrentLevel: (level: QuizLevel) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  submitAnswer: (questionId: string, selectedOptions: number[], isCorrect: boolean) => void;
  startRound: () => void;
  resetRound: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentLevel: 1,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  roundStartTime: null,
  
  setCurrentLevel: (level) => set({ currentLevel: level }),
  
  setQuestions: (questions) => set({ questions }),
  
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  
  submitAnswer: (questionId, selectedOptions, isCorrect) => {
    const { answers } = get();
    const existingAnswer = answers.find((a) => a.questionId === questionId);
    
    if (existingAnswer) {
      // Update existing answer
      set({
        answers: answers.map((a) =>
          a.questionId === questionId
            ? { ...a, selectedOptions, isCorrect, attempted: true }
            : a
        ),
      });
    } else {
      // Add new answer
      set({
        answers: [
          ...answers,
          { questionId, selectedOptions, isCorrect, attempted: true },
        ],
      });
    }
  },
  
  startRound: () => set({ roundStartTime: new Date(), answers: [], currentQuestionIndex: 0 }),
  
  resetRound: () =>
    set({
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      roundStartTime: null,
    }),
}));

