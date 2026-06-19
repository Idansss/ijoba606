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
import { Icon } from '@/components/ui/Icon';

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
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="mx-auto max-w-2xl rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 text-center shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
          <Icon name="lock" className="mb-6 text-[56px] text-royal-gold" filled />
          <h1 className="mb-4 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            Sign In Required
          </h1>
          <p className="mb-8 text-on-surface-variant">
            You need to sign in to create a new thread
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-full bg-gradient-to-r from-deep-green to-royal-gold px-8 py-4 text-lg font-semibold text-on-primary shadow-md transition-all hover:opacity-90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display-lg-mobile text-display-lg-mobile text-deep-green">
            Create New Thread
          </h1>
          <p className="text-on-surface-variant">
            Start a discussion about PAYE, tax, or related topics
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <label className="mb-3 block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Thread Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="What's your question or topic?"
              className="w-full rounded-input border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 focus:border-forest-green focus:outline-none"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-error">{errors.title.message}</p>
            )}
            <p className="mt-2 text-xs text-outline">
              Be specific and clear. Good titles get more responses!
            </p>
          </div>

          {/* Body */}
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <label className="mb-3 block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
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
          <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm">
            <label className="mb-3 block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Tags (Select 1-3)
            </label>
            <div className="mb-4 flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-4 py-2 font-label-sm text-label-sm transition-all ${
                      isSelected
                        ? 'border-deep-green bg-deep-green text-on-primary'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-forest-green'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {errors.tags && (
              <p className="text-sm text-error">{errors.tags.message}</p>
            )}
            <p className="text-xs text-outline">
              Selected: {selectedTags?.length || 0}/3
            </p>
          </div>

          {/* Guidelines */}
          <div className="rounded-input border border-tertiary-container/40 bg-tertiary-container/10 p-4">
            <div className="flex items-start gap-3">
              <Icon name="lightbulb" className="text-[24px] text-tertiary" filled />
              <div>
                <h4 className="mb-1 font-bold text-on-tertiary-container">
                  Before you post
                </h4>
                <ul className="space-y-1 text-sm text-on-tertiary-container">
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
              className="flex-1 rounded-full bg-surface-container-high py-4 font-bold text-on-surface transition-all hover:bg-surface-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-gradient-to-r from-deep-green to-royal-gold py-4 font-bold text-on-primary shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

