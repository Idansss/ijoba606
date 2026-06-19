'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantProfile } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { Icon } from '@/components/ui/Icon';
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
      <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-deep-green" />
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-12 text-center md:px-margin-desktop">
        <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest/90 p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] backdrop-blur-sm sm:p-12">
          <Icon name="person_off" className="mb-4 text-[56px] text-royal-gold" />
          <h1 className="mb-2 font-headline-md text-headline-md text-deep-green">Consultant not found</h1>
          <p className="mb-6 text-on-surface-variant">
            This consultant may no longer be available or the link may be incorrect.
          </p>
          <Link
            href="/consultants/browse"
            className="inline-flex items-center gap-2 rounded-full bg-deep-green px-6 py-3 font-label-sm text-label-sm font-semibold text-on-primary transition hover:bg-forest-green"
          >
            Browse consultants
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = consultant.verificationStatus === 'verified' || consultant.isVerified;

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/consultants/browse"
          className="mb-6 inline-flex items-center gap-2 font-semibold text-deep-green transition hover:text-forest-green"
        >
          <Icon name="arrow_back" className="text-[20px]" />
          Back to consultants
        </Link>

        {/* Hero */}
        <div className="overflow-hidden rounded-bento border border-deep-green/5 shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <div className="bg-gradient-to-r from-deep-green to-forest-green px-6 py-10 sm:px-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-on-primary/20 bg-on-primary/15 font-display-lg text-4xl font-bold text-on-primary">
                {consultant.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <h1 className="flex items-center gap-2 font-display-lg-mobile text-display-lg-mobile text-on-primary">
                  {consultant.name}
                  {isVerified && <Icon name="verified" className="text-[28px] text-tertiary-fixed" filled />}
                </h1>
                {consultant.locationState && (
                  <p className="mt-1 flex items-center gap-1 text-on-primary/90">
                    <Icon name="location_on" className="text-[18px]" />
                    {consultant.locationState}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-on-primary/90">
                  <span className="flex items-center gap-1">
                    <Icon name="star" className="text-[18px] text-tertiary-fixed" filled />
                    {consultant.averageRating?.toFixed(1) ?? 'N/A'} ({consultant.reviewsCount ?? 0} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="work" className="text-[18px]" />
                    {consultant.experienceYears ?? 0} years experience
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="groups" className="text-[18px]" />
                    {consultant.totalClients ?? 0} clients
                  </span>
                </div>
              </div>
              {firebaseUser && (
                <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
                  <Link
                    href={`/consultants/chat/${consultant.id}`}
                    className="flex items-center justify-center gap-2 rounded-full bg-on-primary px-6 py-3 font-label-sm text-label-sm font-semibold text-deep-green transition hover:bg-surface-container"
                  >
                    <Icon name="chat" className="text-[20px]" />
                    Chat
                  </Link>
                  <Link
                    href={`/consultants/request?consultantId=${consultant.id}`}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-on-primary/60 px-6 py-3 font-label-sm text-label-sm font-semibold text-on-primary transition hover:bg-on-primary/10"
                  >
                    <Icon name="handshake" className="text-[20px]" />
                    Hire
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 bg-surface-container-lowest p-6 sm:p-8">
            {/* Bio */}
            <section>
              <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">About</h2>
              <p className="whitespace-pre-line text-on-surface-variant">{consultant.bio}</p>
            </section>

            {/* Specialties */}
            {consultant.specialties && consultant.specialties.length > 0 && (
              <section>
                <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {consultant.specialties.map((spec, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-primary-fixed/30 px-4 py-2 text-sm font-semibold text-on-secondary-fixed"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Rates */}
            {(consultant.hourlyRate || consultant.fixedRateRange) && (
              <section className="rounded-input border border-deep-green/5 bg-surface-container-low p-5">
                <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">Rates</h2>
                <div className="flex flex-wrap items-baseline gap-4">
                  {consultant.hourlyRate && (
                    <span className="font-figure-xl text-figure-xl text-deep-green">
                      ₦{consultant.hourlyRate.toLocaleString()}/hr
                    </span>
                  )}
                  {consultant.fixedRateRange && (
                    <span className="text-on-surface-variant">
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
                <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">Qualifications</h2>
                <ul className="space-y-2">
                  {consultant.qualifications.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Icon name="school" className="mt-0.5 shrink-0 text-[20px] text-forest-green" />
                      <div>
                        <span className="font-semibold text-on-surface">{q.title}</span>
                        {q.institution && (
                          <span className="text-on-surface-variant"> — {q.institution}</span>
                        )}
                        {q.year && (
                          <span className="text-sm text-outline"> ({q.year})</span>
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
                <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">Certifications</h2>
                <ul className="space-y-2">
                  {consultant.certifications.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Icon name="workspace_premium" className="mt-0.5 shrink-0 text-[20px] text-secondary" />
                      <div>
                        <span className="font-semibold text-on-surface">{c.name}</span>
                        {c.issuingBody && (
                          <span className="text-on-surface-variant"> — {c.issuingBody}</span>
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
                <h2 className="mb-2 font-headline-md text-headline-md text-deep-green">Experience</h2>
                <ul className="space-y-4">
                  {consultant.workExperience.map((w, idx) => (
                    <li key={idx} className="border-l-2 border-primary-fixed pl-4">
                      <p className="font-semibold text-on-surface">{w.title}</p>
                      <p className="text-on-surface-variant">{w.company}</p>
                      {w.startDate?.toDate && (
                        <p className="text-sm text-outline">
                          {format(w.startDate.toDate(), 'MMM yyyy')}
                          {w.endDate?.toDate
                            ? ` – ${format(w.endDate.toDate(), 'MMM yyyy')}`
                            : ' – Present'}
                        </p>
                      )}
                      {w.description && (
                        <p className="mt-1 text-sm text-on-surface-variant">{w.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Contact via chat only */}
            {firebaseUser && (
              <section className="border-t border-outline-variant/40 pt-6">
                <p className="text-sm text-on-surface-variant">
                  To connect with this consultant, use the <strong>Chat</strong> button above. All
                  communication happens through our platform to protect both parties.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
