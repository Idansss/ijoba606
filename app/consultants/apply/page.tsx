'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { consultantApplicationSchema, ConsultantApplicationFormData } from '@/lib/validation/schemas';
import { createConsultantApplication } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { storage } from '@/lib/firebase/config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ConsultantDocument } from '@/lib/types';
import { CloudUpload } from 'lucide-react';

const SPECIALTY_OPTIONS = [
  'PAYE Compliance',
  'Personal Income Tax',
  'Tax Reliefs & Exemptions',
  'Tax Filing & Returns',
  'Employment Tax Issues',
  'Self-Employed Tax',
  'Tax Planning',
  'Other',
];

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Please try again.`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });

export default function ConsultantApplyPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ConsultantApplicationFormData>({
    resolver: zodResolver(consultantApplicationSchema),
    defaultValues: {
      specialties: [],
    },
  });

  const selectedSpecialties = watch('specialties') || [];

  const onSubmit = async (data: ConsultantApplicationFormData) => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to submit an application' });
      return;
    }

    setSubmitting(true);
    try {
      let uploadedDocs: ConsultantDocument[] = [];

      if (documents.length > 0) {
        if (!storage) {
          addToast({ type: 'error', message: 'File upload is unavailable right now. Please try again later.' });
          setSubmitting(false);
          return;
        }

        setUploadingDocs(true);
        uploadedDocs = [];
        try {
          for (const file of documents) {
            if (file.size > 10 * 1024 * 1024) {
              throw new Error(`${file.name} is larger than 10MB. Please upload a smaller file.`);
            }
            const fileRef = ref(
              storage,
              `consultantApplications/${firebaseUser.uid}/${Date.now()}-${file.name}`
            );
            await withTimeout(uploadBytes(fileRef, file), 45000, `Uploading ${file.name}`);
            const url = await withTimeout(
              getDownloadURL(fileRef),
              15000,
              `Fetching download URL for ${file.name}`
            );
            uploadedDocs.push({
              name: file.name,
              url,
              contentType: file.type || undefined,
              size: file.size,
            });
          }
        } finally {
          setUploadingDocs(false);
        }
      }

      await createConsultantApplication({
        ...data,
        credentialsUrl: data.credentialsUrl?.trim() ? data.credentialsUrl.trim() : undefined,
        documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,
      });
      router.push('/consultants/thanks?type=apply');
    } catch (error) {
      console.error('Error submitting application:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
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
          <h1 className="text-4xl font-bold text-gray-800">Consultant Application</h1>
        </div>
        <p className="text-gray-600">
          Join our network of verified tax consultants. Upload supporting documents so our team can review and approve your application.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-100"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
            placeholder="e.g., +234 801 234 5678"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            WhatsApp (optional)
          </label>
          <input
            type="tel"
            {...register('whatsapp')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
          />
          {errors.whatsapp && (
            <p className="mt-1 text-xs text-rose-500">{errors.whatsapp.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location / State (optional)
          </label>
          <input
            type="text"
            {...register('locationState')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years of Experience (optional)
          </label>
          <input
            type="number"
            {...register('experienceYears', { valueAsNumber: true })}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
            min="0"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Specialties * (Select 1-5)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIALTY_OPTIONS.map((specialty) => {
              const isSelected = selectedSpecialties?.includes(specialty);
              return (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => {
                    const current = selectedSpecialties;
                    if (current.includes(specialty)) {
                      setValue('specialties', current.filter((s) => s !== specialty));
                    } else if (current.length < 5) {
                      setValue('specialties', [...current, specialty]);
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {specialty}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register('specialties')} />
          {errors.specialties && (
            <p className="mt-1 text-xs text-rose-500">{errors.specialties.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bio / Professional Background * (50-1000 characters)
          </label>
          <textarea
            {...register('bio')}
            rows={6}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
            placeholder="Tell us about your experience, qualifications, and expertise..."
          />
          {errors.bio && (
            <p className="mt-1 text-xs text-rose-500">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Credentials URL (optional)
          </label>
          <input
            type="url"
            {...register('credentialsUrl')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition focus:border-purple-300 focus:outline-none"
            placeholder="https://..."
          />
          {errors.credentialsUrl && (
            <p className="mt-1 text-xs text-rose-500">{errors.credentialsUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Supporting Documents (CV, certificates, IDs, etc.)
          </label>
          <label
            htmlFor="consultant-documents"
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 px-6 py-8 text-center transition hover:border-purple-400 hover:bg-purple-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-purple-600 shadow-sm">
              <CloudUpload className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-gray-700">
              Click to upload documents
            </span>
            <span className="text-xs text-gray-500">
              PDF, DOC/DOCX, JPG, JPEG, PNG (max 10MB each)
            </span>
          </label>
          <input
            id="consultant-documents"
            type="file"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              setDocuments(files);
            }}
            className="hidden"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
          />
          {documents.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {documents.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploadingDocs}
          className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadingDocs ? 'Uploading documents...' : submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </motion.form>
    </div>
  );
}

