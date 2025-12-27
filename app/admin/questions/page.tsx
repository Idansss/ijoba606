'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Question } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionSchema, QuestionFormData } from '@/lib/validation/schemas';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      level: 1,
      type: 'single',
      prompt: '',
      options: ['', '', '', ''],
      correct: [],
      explanation: '',
      tags: [],
    },
  });

  const fetchQuestions = useCallback(async () => {
    try {
      if (!db) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const questionsRef = collection(db, 'questions');
      const snapshot = await getDocs(questionsRef);
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      addToast({ type: 'error', message: 'Failed to fetch questions' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      addToast({ type: 'error', message: 'Admin access required' });
      router.push('/');
    }
  }, [user, authLoading, router, addToast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchQuestions();
    }
  }, [user, fetchQuestions]);

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      reset({
        level: question.level,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation || '',
        tags: question.tags || [],
      });
    } else {
      setEditingQuestion(null);
      reset();
    }
    setShowModal(true);
  };

  const onSubmit = async (data: QuestionFormData) => {
    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Question management is disabled in this local demo (no Firebase configuration).',
        });
        return;
      }
      if (editingQuestion) {
        // Update existing
        const questionRef = doc(db, 'questions', editingQuestion.id);
        await updateDoc(questionRef, data);
        addToast({ type: 'success', message: 'Question updated!' });
      } else {
        // Create new
        await addDoc(collection(db, 'questions'), data);
        addToast({ type: 'success', message: 'Question created!' });
      }

      setShowModal(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      addToast({ type: 'error', message: 'Failed to save question' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Question management is disabled in this local demo (no Firebase configuration).',
        });
        return;
      }
      await deleteDoc(doc(db, 'questions', id));
      addToast({ type: 'success', message: 'Question deleted' });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      addToast({ type: 'error', message: 'Failed to delete question' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  const questionsByLevel = [1, 2, 3].map((level) => ({
    level,
    questions: questions.filter((q) => q.level === level),
  }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Question Management
            </h1>
            <p className="text-gray-600">
              Total: {questions.length} questions
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            + Add Question
          </button>
        </div>

        {/* Questions by Level */}
        <div className="space-y-8">
          {questionsByLevel.map(({ level, questions: levelQuestions }) => (
            <div key={level}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Level {level} ({levelQuestions.length} questions)
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {levelQuestions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            question.type === 'single'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {question.type === 'single' ? 'Single' : 'Multi'}
                          </span>
                          {question.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {question.prompt}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          {question.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={
                                question.correct.includes(idx)
                                  ? 'text-green-600 font-semibold'
                                  : ''
                              }>
                                {String.fromCharCode(65 + idx)}. {option}
                              </span>
                              {question.correct.includes(idx) && (
                                <span className="text-green-600">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            💡 {question.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(question)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {levelQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No questions for Level {level} yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
              >
                <div className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Level & Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Level
                        </label>
                        <select
                          {...register('level', { valueAsNumber: true })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                        >
                          <option value={1}>Level 1 - Basics</option>
                          <option value={2}>Level 2 - Calculations</option>
                          <option value={3}>Level 3 - Scenarios</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          {...register('type')}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                        >
                          <option value="single">Single Answer</option>
                          <option value="multi">Multiple Answers</option>
                        </select>
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Prompt
                      </label>
                      <textarea
                        {...register('prompt')}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                      />
                      {errors.prompt && (
                        <p className="text-red-500 text-sm mt-1">{errors.prompt.message}</p>
                      )}
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            {...register(`options.${idx}` as 'options.0' | 'options.1' | 'options.2' | 'options.3')}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Correct Answers */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correct Answer(s) - Enter indices (0-3), comma separated
                      </label>
                      <input
                        {...register('correct', {
                          setValueAs: (v) =>
                            v.split(',').map((n: string) => parseInt(n.trim())),
                        })}
                        placeholder="e.g., 0 or 0,2"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                      />
                      {errors.correct && (
                        <p className="text-red-500 text-sm mt-1">{errors.correct.message}</p>
                      )}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Explanation (optional)
                      </label>
                      <textarea
                        {...register('explanation')}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                      >
                        {editingQuestion ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

