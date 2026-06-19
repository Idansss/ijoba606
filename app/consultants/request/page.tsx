'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { consultantRequestSchema, ConsultantRequestFormData } from '@/lib/validation/schemas';
import { createConsultantRequest } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { ComingSoonBadge } from '@/components/consultants/ComingSoonBadge';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';
import { Select } from '@/components/ui/Select';

export default function ConsultantRequestPage() {
  const router = useRouter();
  const { firebaseUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ConsultantRequestFormData>({
    resolver: zodResolver(consultantRequestSchema),
    defaultValues: {
      name: user?.handle ? formatHandleForDisplay(user.handle) : '',
      email: '',
    },
  });

  const onSubmit = async (data: ConsultantRequestFormData) => {
    setSubmitting(true);
    try {
      await createConsultantRequest(data);
      router.push('/consultants/thanks?type=request');
    } catch (error) {
      console.error('Error submitting request:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit request. Please try again.';
      addToast({ type: 'error', message });
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-4xl font-bold text-[#1a1c15]">Join the Waitlist</h1>
          <ComingSoonBadge />
        </div>
        <p className="text-[#404a3b]">
          Tell us what you need help with. We'll match you with a verified consultant when sessions open.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-[#efefe2]"
      >
        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Name (optional)
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full rounded-2xl border border-[#e3e3d7] bg-white px-4 py-3 text-[#1a1c15] transition focus:border-[#7fb56a] focus:outline-none"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Email *
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-2xl border border-[#e3e3d7] bg-white px-4 py-3 text-[#1a1c15] transition focus:border-[#7fb56a] focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Topic / Question *
          </label>
          <textarea
            {...register('topic')}
            rows={4}
            className="w-full rounded-2xl border border-[#e3e3d7] bg-white px-4 py-3 text-[#1a1c15] transition focus:border-[#7fb56a] focus:outline-none"
            placeholder="What do you need help with? Be as specific as possible..."
          />
          {errors.topic && (
            <p className="mt-1 text-xs text-rose-500">{errors.topic.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Category *
          </label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="px-4 py-3"
                options={[
                  { value: 'PAYE', label: 'PAYE' },
                  { value: 'Reliefs', label: 'Reliefs' },
                  { value: 'Filing', label: 'Filing' },
                  { value: 'Employment', label: 'Employment' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            )}
          />
          {errors.category && (
            <p className="mt-1 text-xs text-rose-500">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Urgency *
          </label>
          <Controller
            control={control}
            name="urgency"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="px-4 py-3"
                options={[
                  { value: 'ASAP', label: 'ASAP' },
                  { value: 'This week', label: 'This week' },
                  { value: 'Later', label: 'Later' },
                ]}
              />
            )}
          />
          {errors.urgency && (
            <p className="mt-1 text-xs text-rose-500">{errors.urgency.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#404a3b] mb-2">
            Budget Range (optional)
          </label>
          <Controller
            control={control}
            name="budgetRange"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Not specified"
                className="px-4 py-3"
                options={[
                  { value: 'Under ₦10k', label: 'Under ₦10k' },
                  { value: '₦10k–₦25k', label: '₦10k–₦25k' },
                  { value: '₦25k–₦50k', label: '₦25k–₦50k' },
                  { value: '₦50k+', label: '₦50k+' },
                ]}
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-gradient-to-r from-[#006400] to-[#109a48] px-6 py-4 text-lg font-semibold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Join Waitlist'}
        </button>
      </motion.form>
    </div>
  );
}

