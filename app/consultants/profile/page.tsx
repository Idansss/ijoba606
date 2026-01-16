'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantProfile, ConsultantQualification, ConsultantCertification, ConsultantWorkExperience, ConsultantPortfolioItem } from '@/lib/types';
import { Plus, Trash2, Save, Upload, X } from 'lucide-react';
import { formatHandleForDisplay } from '@/lib/utils/formatHandle';

export default function ConsultantProfilePage() {
  const router = useRouter();
  const { firebaseUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<ConsultantProfile>>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    locationState: '',
    bio: '',
    specialties: [],
    experienceYears: 0,
    qualifications: [],
    certifications: [],
    workExperience: [],
    portfolioItems: [],
    hourlyRate: undefined,
    fixedRateRange: undefined,
    availabilityStatus: 'available',
    totalClients: 0,
    totalProjects: 0,
    reviewsCount: 0,
    isVerified: false,
    isActive: true,
  });

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to access your consultant profile' });
      router.push('/consultants/apply');
      return;
    }

    // Check if user is an approved consultant
    checkConsultantStatus();
  }, [firebaseUser, router, addToast]);

  const checkConsultantStatus = async () => {
    if (!db || !firebaseUser) return;

    try {
      // Check if application is approved
      const appRef = doc(db, 'consultantApplications', firebaseUser.uid);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists() || appSnap.data().status !== 'approved') {
        addToast({ 
          type: 'info', 
          message: 'Your consultant application is pending approval. Please wait for admin approval.' 
        });
        router.push('/consultants');
        return;
      }

      // Load existing profile
      const profileRef = doc(db, 'consultantProfiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfile({
          ...data,
          qualifications: data.qualifications || [],
          certifications: data.certifications || [],
          workExperience: data.workExperience || [],
          portfolioItems: data.portfolioItems || [],
        });
      } else {
        // Initialize with user data
        setProfile(prev => ({
          ...prev,
          name: formatHandleForDisplay(user?.handle || ''),
          email: firebaseUser.email || '',
        }));
      }
    } catch (error) {
      console.error('Error checking consultant status:', error);
      addToast({ type: 'error', message: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!db || !firebaseUser) return;

    setSaving(true);
    try {
      const profileData: Partial<ConsultantProfile> = {
        ...profile,
        uid: firebaseUser.uid,
        updatedAt: serverTimestamp() as any,
      };

      if (!profile.createdAt) {
        profileData.createdAt = serverTimestamp() as any;
      }

      const profileRef = doc(db, 'consultantProfiles', firebaseUser.uid);
      await setDoc(profileRef, profileData, { merge: true });

      addToast({ type: 'success', message: 'Profile saved successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      addToast({ type: 'error', message: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    setProfile(prev => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), { title: '', institution: '', year: undefined }],
    }));
  };

  const removeQualification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      qualifications: prev.qualifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateQualification = (index: number, field: keyof ConsultantQualification, value: any) => {
    setProfile(prev => {
      const quals = [...(prev.qualifications || [])];
      quals[index] = { ...quals[index], [field]: value };
      return { ...prev, qualifications: quals };
    });
  };

  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), { name: '', issuingBody: '' }],
    }));
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateCertification = (index: number, field: keyof ConsultantCertification, value: any) => {
    setProfile(prev => {
      const certs = [...(prev.certifications || [])];
      certs[index] = { ...certs[index], [field]: value };
      return { ...prev, certifications: certs };
    });
  };

  const addWorkExperience = () => {
    setProfile(prev => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), { 
        title: '', 
        company: '', 
        startDate: Timestamp.now(),
        endDate: undefined,
      }],
    }));
  };

  const removeWorkExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateWorkExperience = (index: number, field: keyof ConsultantWorkExperience, value: any) => {
    setProfile(prev => {
      const exp = [...(prev.workExperience || [])];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, workExperience: exp };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Consultant Profile
        </h1>
        <p className="text-gray-600">Build your professional profile to attract clients</p>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (Optional)</label>
              <input
                type="tel"
                value={profile.whatsapp || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (State)</label>
              <input
                type="text"
                value={profile.locationState || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, locationState: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Lagos, Abuja"
              />
            </div>
          </div>
        </section>

        {/* Professional Bio */}
        <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Professional Bio *</h2>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Tell clients about your expertise, approach, and what makes you unique..."
            required
          />
        </section>

        {/* Specialties */}
        <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Specialties *</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['PAYE', 'Reliefs', 'Filing', 'Employment Tax', 'Tax Planning', 'Compliance', 'Audit Support'].map(spec => (
              <button
                key={spec}
                onClick={() => {
                  const current = profile.specialties || [];
                  if (current.includes(spec)) {
                    setProfile(prev => ({ ...prev, specialties: current.filter(s => s !== spec) }));
                  } else {
                    setProfile(prev => ({ ...prev, specialties: [...current, spec] }));
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  profile.specialties?.includes(spec)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </section>

        {/* Experience & Qualifications */}
        <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Experience & Qualifications</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setProfile(prev => ({ ...prev, experienceYears: (prev.experienceYears || 0) + 1 }))}
                className="px-3 py-1 bg-gray-100 rounded-lg text-sm"
              >
                + Years
              </button>
              <span className="px-3 py-1 bg-purple-100 rounded-lg text-sm font-semibold">
                {profile.experienceYears || 0} years
              </span>
            </div>
          </div>

          {/* Qualifications */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Qualifications</h3>
              <button
                onClick={addQualification}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {profile.qualifications?.map((qual, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Title (e.g., B.Sc Accounting)"
                  value={qual.title}
                  onChange={(e) => updateQualification(index, 'title', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={qual.institution}
                  onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={qual.year || ''}
                  onChange={(e) => updateQualification(index, 'year', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => removeQualification(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4 inline" />
                </button>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Certifications</h3>
              <button
                onClick={addCertification}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {profile.certifications?.map((cert, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Name (e.g., ICAN)"
                  value={cert.name}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Issuing Body"
                  value={cert.issuingBody}
                  onChange={(e) => updateCertification(index, 'issuingBody', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => removeCertification(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4 inline" />
                </button>
              </div>
            ))}
          </div>

          {/* Work Experience */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <button
                onClick={addWorkExperience}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {profile.workExperience?.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={exp.description || ''}
                  onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => removeWorkExperience(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 inline" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rates */}
        <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₦)</label>
              <input
                type="number"
                value={profile.hourlyRate || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select
                value={profile.availabilityStatus || 'available'}
                onChange={(e) => setProfile(prev => ({ ...prev, availabilityStatus: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !profile.name || !profile.email || !profile.phone || !profile.bio}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
