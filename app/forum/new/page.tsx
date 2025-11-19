'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createThreadSchema, CreateThreadFormData } from '@/lib/validation/schemas';
import { MarkdownEditor } from '@/components/forum/MarkdownEditor';
import { createThread } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';

const AVAILABLE_TAGS = [
  'Pension',
  'Reliefs',
  'Beginners',
  'Calculations',
  'Tax-Codes',
  'Self-Employed',
  'PAYE-Basics',
  'Deductions',
  'Allowances',
  'Filing',
];

export default function NewThreadPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateThreadFormData>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: '',
      bodyMD: '',
      tags: [],
    },
  });

  const selectedTags = watch('tags');

  const toggleTag = (tag: string) => {
    const current = selectedTags || [];
    if (current.includes(tag)) {
      setValue('tags', current.filter((t) => t !== tag));
    } else if (current.length < 3) {
      setValue('tags', [...current, tag]);
    } else {
      addToast({ type: 'warning', message: 'Maximum 3 tags allowed' });
    }
  };

  const onSubmit = async (data: CreateThreadFormData) => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Sign in to create a thread' });
      router.push('/');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createThread(data);
      addToast({ type: 'success', message: 'Thread created successfully! 🎉' });
      router.push(`/forum/thread/${response.threadId}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      addToast({
        type: 'error',
        message: 'Failed to create thread. Try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-8">
            You need to sign in to create a new thread
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create New Thread
          </h1>
          <p className="text-gray-600">
            Start a discussion about PAYE, tax, or related topics
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Thread Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="What's your question or topic?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">{errors.title.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Be specific and clear. Good titles get more responses!
            </p>
          </div>

          {/* Body */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Description
            </label>
            <Controller
              name="bodyMD"
              control={control}
              render={({ field }) => (
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Provide details, context, or examples..."
                  minHeight="300px"
                  maxLength={5000}
                  error={errors.bodyMD?.message}
                />
              )}
            />
          </div>

          {/* Tags */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tags (Select 1-3)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full font-semibold border-2 transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {errors.tags && (
              <p className="text-red-500 text-sm">{errors.tags.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Selected: {selectedTags?.length || 0}/3
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-bold text-yellow-900 mb-1">
                  Before you post
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Search if your question has been answered</li>
                  <li>• Be respectful and courteous</li>
                  <li>• Provide context and details</li>
                  <li>• This is for educational discussion only</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

