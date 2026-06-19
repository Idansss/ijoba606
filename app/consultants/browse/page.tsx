'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantProfile } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { Search, Star, MapPin, Briefcase, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';
import { Select } from '@/components/ui/Select';

export default function BrowseConsultantsPage() {
  const { firebaseUser } = useAuthStore();
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'clients'>('experience');

  useEffect(() => {
    fetchConsultants();
  }, [selectedSpecialty, sortBy]);

  const fetchConsultants = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const consultantsRef = collection(db, 'consultantProfiles');
      let q;

      // Filter by specialty if selected
      if (selectedSpecialty !== 'all') {
        q = query(
          consultantsRef,
          where('specialties', 'array-contains', selectedSpecialty),
          where('activityStatus', '==', 'active'),
          where('verificationStatus', '==', 'verified'),
          orderBy(sortBy === 'rating' ? 'averageRating' : sortBy === 'experience' ? 'experienceYears' : 'totalClients', 'desc'),
          limit(50)
        );
      } else {
        q = query(
          consultantsRef,
          where('activityStatus', '==', 'active'),
          where('verificationStatus', '==', 'verified'),
          orderBy(sortBy === 'rating' ? 'averageRating' : sortBy === 'experience' ? 'experienceYears' : 'totalClients', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      let consultantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConsultantProfile[];

      // If query returned empty, use fallback (e.g. profiles missing orderBy field get excluded)
      if (consultantsData.length === 0) {
        throw new Error('Use fallback');
      }

      setConsultants(consultantsData);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      // Fallback: fetch all and filter client-side
      try {
        const consultantsRef = collection(db, 'consultantProfiles');
        const snapshot = await getDocs(consultantsRef);
        let consultantsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ConsultantProfile[];

        consultantsData = consultantsData.filter(c => {
          const isVerified = c.verificationStatus
            ? c.verificationStatus === 'verified'
            : c.isVerified !== false;
          const isActive = c.activityStatus
            ? c.activityStatus === 'active'
            : c.isActive !== false;
          return isVerified && isActive;
        });
        
        if (selectedSpecialty !== 'all') {
          consultantsData = consultantsData.filter(c => 
            c.specialties?.includes(selectedSpecialty)
          );
        }

        // Sort client-side
        consultantsData.sort((a, b) => {
          if (sortBy === 'rating') {
            return (b.averageRating || 0) - (a.averageRating || 0);
          } else if (sortBy === 'experience') {
            return (b.experienceYears || 0) - (a.experienceYears || 0);
          } else {
            return (b.totalClients || 0) - (a.totalClients || 0);
          }
        });

        setConsultants(consultantsData);
      } catch (fallbackError) {
        console.error('Fallback fetch error:', fallbackError);
        setConsultants([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultants = consultants.filter(consultant => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      consultant.name?.toLowerCase().includes(query) ||
      consultant.bio?.toLowerCase().includes(query) ||
      consultant.specialties?.some(s => s.toLowerCase().includes(query))
    );
  });

  const specialties = ['all', 'PAYE', 'Reliefs', 'Filing', 'Employment Tax', 'Tax Planning', 'Compliance', 'Audit Support'];

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-8">
        <h1 className="font-display-lg-mobile text-display-lg-mobile mb-2 text-deep-green">
          Find a Consultant
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Connect with verified tax experts for personalized advice</p>
      </div>

      {/* Search and Filters */}
      <div className="rounded-bento border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="text"
              placeholder="Search by name, specialty, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-input border border-outline-variant bg-surface-container-low text-on-surface focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
            />
          </div>
          <Select
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
            className="w-full md:w-56"
            options={specialties.map((spec) => ({
              value: spec,
              label: spec === 'all' ? 'All Specialties' : spec,
            }))}
          />
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v as any)}
            className="w-full md:w-56"
            options={[
              { value: 'rating', label: 'Sort by Rating' },
              { value: 'experience', label: 'Sort by Experience' },
              { value: 'clients', label: 'Sort by Clients' },
            ]}
          />
        </div>
      </div>

      {/* Consultants Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#006400]"></div>
        </div>
      ) : filteredConsultants.length === 0 ? (
        <div className="text-center py-12 rounded-bento border border-deep-green/5 bg-surface-container-lowest shadow-[0px_10px_30px_rgba(0,50,0,0.05)]">
          <p className="text-on-surface-variant text-lg">No consultants found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsultants.map((consultant) => (
            <div
              key={consultant.id}
              className="rounded-bento border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_10px_30px_rgba(0,50,0,0.05)] transition hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-forest-green flex items-center justify-center text-on-primary text-2xl font-bold">
                    {consultant.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                      {consultant.name}
                      {(consultant.verificationStatus === 'verified' || consultant.isVerified) && (
                        <CheckCircle2 className="w-5 h-5 text-forest-green" />
                      )}
                    </h3>
                    {consultant.locationState && (
                      <p className="text-sm text-on-surface-variant flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {consultant.locationState}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-on-surface-variant text-sm mb-4 line-clamp-3">
                {consultant.bio}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {consultant.specialties?.slice(0, 3).map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-fixed/30 text-deep-green rounded-full font-label-sm text-xs font-semibold"
                  >
                    {spec}
                  </span>
                ))}
                {consultant.specialties && consultant.specialties.length > 3 && (
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-semibold">
                    +{consultant.specialties.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#c59f00] fill-[#c59f00]" />
                  <span className="font-semibold">
                    {consultant.averageRating?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="text-on-surface-variant/60">
                    ({consultant.reviewsCount || 0})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {consultant.experienceYears || 0} yrs
                  </span>
                  <span>{consultant.totalClients || 0} clients</span>
                </div>
              </div>

              {consultant.hourlyRate && (
                <div className="mb-4">
                  <span className="font-figure-md text-lg font-bold text-deep-green">
                    ₦{consultant.hourlyRate.toLocaleString()}/hr
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/consultants/${consultant.id}`}
                  className="flex-1 text-center px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full font-label-sm font-semibold hover:bg-surface-container-high transition"
                >
                  View Profile
                </Link>
                {firebaseUser && (
                  <Link
                    href={`/consultants/chat/${consultant.id}`}
                    className="flex-1 text-center px-4 py-2 bg-deep-green text-on-primary rounded-full font-label-sm font-semibold hover:bg-forest-green transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
