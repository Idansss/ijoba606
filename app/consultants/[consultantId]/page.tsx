'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantProfile } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import {
  Star,
  MapPin,
  Briefcase,
  MessageCircle,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';

export default function ConsultantProfileViewPage() {
  const params = useParams();
  const consultantId = params?.consultantId as string;
  const { firebaseUser } = useAuthStore();
  const [consultant, setConsultant] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consultantId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const profileRef = doc(db, 'consultantProfiles', consultantId);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setConsultant({ id: snap.id, ...snap.data() } as ConsultantProfile);
        } else {
          setConsultant(null);
        }
      } catch (error) {
        console.error('Error fetching consultant:', error);
        setConsultant(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [consultantId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consultant not found</h1>
        <p className="text-gray-600 mb-6">
          This consultant may no longer be available or the link may be incorrect.
        </p>
        <Link
          href="/consultants/browse"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
        >
          Browse consultants
        </Link>
      </div>
    );
  }

  const isVerified = consultant.verificationStatus === 'verified' || consultant.isVerified;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/consultants/browse"
        className="inline-flex text-sm text-purple-600 hover:text-purple-700 font-semibold mb-6"
      >
        ← Back to consultants
      </Link>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold">
              {consultant.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                {consultant.name}
                {isVerified && <CheckCircle2 className="w-8 h-8" />}
              </h1>
              {consultant.locationState && (
                <p className="text-white/90 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {consultant.locationState}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  {consultant.averageRating?.toFixed(1) ?? 'N/A'} ({consultant.reviewsCount ?? 0} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {consultant.experienceYears ?? 0} years experience
                </span>
                <span>{consultant.totalClients ?? 0} clients</span>
              </div>
            </div>
            {firebaseUser && (
              <Link
                href={`/consultants/chat/${consultant.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Chat
              </Link>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Bio */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{consultant.bio}</p>
          </section>

          {/* Specialties */}
          {consultant.specialties && consultant.specialties.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {consultant.specialties.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Rates */}
          {(consultant.hourlyRate || consultant.fixedRateRange) && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Rates</h2>
              <div className="flex flex-wrap gap-4">
                {consultant.hourlyRate && (
                  <span className="text-xl font-bold text-purple-600">
                    ₦{consultant.hourlyRate.toLocaleString()}/hr
                  </span>
                )}
                {consultant.fixedRateRange && (
                  <span className="text-gray-700">
                    Fixed: ₦{consultant.fixedRateRange.min.toLocaleString()} – ₦
                    {consultant.fixedRateRange.max.toLocaleString()}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Qualifications */}
          {consultant.qualifications && consultant.qualifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Qualifications</h2>
              <ul className="space-y-2">
                {consultant.qualifications.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">{q.title}</span>
                      {q.institution && (
                        <span className="text-gray-600"> — {q.institution}</span>
                      )}
                      {q.year && (
                        <span className="text-gray-500 text-sm"> ({q.year})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Certifications */}
          {consultant.certifications && consultant.certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Certifications</h2>
              <ul className="space-y-2">
                {consultant.certifications.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      {c.issuingBody && (
                        <span className="text-gray-600"> — {c.issuingBody}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Work Experience */}
          {consultant.workExperience && consultant.workExperience.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Experience</h2>
              <ul className="space-y-4">
                {consultant.workExperience.map((w, idx) => (
                  <li key={idx} className="border-l-2 border-purple-200 pl-4">
                    <p className="font-semibold text-gray-900">{w.title}</p>
                    <p className="text-gray-600">{w.company}</p>
                    {w.startDate?.toDate && (
                      <p className="text-sm text-gray-500">
                        {format(w.startDate.toDate(), 'MMM yyyy')}
                        {w.endDate?.toDate
                          ? ` – ${format(w.endDate.toDate(), 'MMM yyyy')}`
                          : ' – Present'}
                      </p>
                    )}
                    {w.description && (
                      <p className="text-gray-700 mt-1 text-sm">{w.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contact */}
          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href={`mailto:${consultant.email}`}
                className="flex items-center gap-2 text-purple-600 hover:underline"
              >
                <Mail className="w-4 h-4" />
                {consultant.email}
              </a>
              <a
                href={`tel:${consultant.phone}`}
                className="flex items-center gap-2 text-purple-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {consultant.phone}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
