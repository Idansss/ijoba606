'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantProfile } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { Search, Star, MapPin, Briefcase, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';

export default function BrowseConsultantsPage() {
  const { firebaseUser } = useAuthStore();
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'clients'>('rating');

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
          where('isActive', '==', true),
          orderBy(sortBy === 'rating' ? 'averageRating' : sortBy === 'experience' ? 'experienceYears' : 'totalClients', 'desc'),
          limit(50)
        );
      } else {
        q = query(
          consultantsRef,
          where('isActive', '==', true),
          orderBy(sortBy === 'rating' ? 'averageRating' : sortBy === 'experience' ? 'experienceYears' : 'totalClients', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const consultantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConsultantProfile[];

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

        consultantsData = consultantsData.filter(c => c.isActive !== false);
        
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
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Find a Consultant
        </h1>
        <p className="text-gray-600">Connect with verified tax experts for personalized advice</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialty, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {specialties.map(spec => (
              <option key={spec} value={spec}>
                {spec === 'all' ? 'All Specialties' : spec}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
            <option value="clients">Sort by Clients</option>
          </select>
        </div>
      </div>

      {/* Consultants Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredConsultants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-600 text-lg">No consultants found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsultants.map((consultant) => (
            <div
              key={consultant.id}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {consultant.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {consultant.name}
                      {consultant.isVerified && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </h3>
                    {consultant.locationState && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {consultant.locationState}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {consultant.bio}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {consultant.specialties?.slice(0, 3).map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold"
                  >
                    {spec}
                  </span>
                ))}
                {consultant.specialties && consultant.specialties.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                    +{consultant.specialties.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">
                    {consultant.averageRating?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="text-gray-500">
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
                  <span className="text-lg font-bold text-purple-600">
                    ₦{consultant.hourlyRate.toLocaleString()}/hr
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/consultants/${consultant.id}`}
                  className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  View Profile
                </Link>
                {firebaseUser && (
                  <Link
                    href={`/consultants/chat/${consultant.id}`}
                    className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition flex items-center justify-center gap-2"
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
