'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  limit,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ConsultantApplication, ConsultantProfile } from '@/lib/types';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'applications' | 'consultants';

export default function AdminConsultantsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ConsultantApplication[]>([]);
  const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Admin access guard
  useEffect(() => {
    if (!authLoading) {
      if (user?.anon === true) {
        addToast({ type: 'error', message: 'Admin access requires a registered account. Please sign in with Google.' });
        router.push('/');
        return;
      }
      if (user?.role !== 'admin') {
        addToast({ type: 'error', message: 'Admin access required' });
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router, addToast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) {
        setApplications([]);
        setProfiles([]);
        return;
      }

      const appsRef = collection(db, 'consultantApplications');
      const appsQuery = query(appsRef, orderBy('createdAt', 'desc'), limit(200));
      const appsSnap = await getDocs(appsQuery);
      const appsData = appsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ConsultantApplication[];

      const profilesRef = collection(db, 'consultantProfiles');
      const profilesQuery = query(profilesRef, orderBy('createdAt', 'desc'), limit(200));
      const profilesSnap = await getDocs(profilesQuery);
      const profilesData = profilesSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ConsultantProfile[];

      setApplications(appsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching consultant data:', error);
      addToast({ type: 'error', message: 'Failed to fetch consultant data' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  const handleUpdateApplicationStatus = async (appId: string, status: ConsultantApplication['status']) => {
    if (!db) return;
    setUpdatingId(appId);
    try {
      const application = applications.find((app) => app.id === appId);
      const appRef = doc(db, 'consultantApplications', appId);
      await updateDoc(appRef, {
        status,
        verificationStatus: status === 'approved' ? 'verified' : 'unverified',
        updatedAt: serverTimestamp(),
      });

      if (status === 'approved' && application) {
        const profileId = application.uid || appId;
        const profileRef = doc(db, 'consultantProfiles', profileId);
        await setDoc(
          profileRef,
          {
            uid: profileId,
            name: application.name,
            email: application.email,
            phone: application.phone,
            whatsapp: application.whatsapp,
            locationState: application.locationState,
            bio: application.bio,
            specialties: application.specialties || [],
            experienceYears: application.experienceYears ?? 0,
            qualifications: [],
            certifications: [],
            workExperience: [],
            portfolioItems: [],
            availabilityStatus: 'unavailable',
            totalClients: 0,
            totalProjects: 0,
            reviewsCount: 0,
            isVerified: true,
            isActive: false,
            verificationStatus: 'verified',
            activityStatus: 'inactive',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? { ...app, status, verificationStatus: status === 'approved' ? 'verified' : 'unverified' }
            : app
        )
      );
      await fetchData();
      addToast({ type: 'success', message: `Application updated to ${status}` });
    } catch (error) {
      console.error('Error updating application status:', error);
      addToast({ type: 'error', message: 'Failed to update application status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateProfileStatus = async (
    profileId: string,
    updates: Partial<Pick<ConsultantProfile, 'verificationStatus' | 'activityStatus'>>
  ) => {
    if (!db) return;
    setUpdatingId(profileId);
    try {
      const profileRef = doc(db, 'consultantProfiles', profileId);
      const verificationStatus = updates.verificationStatus;
      const activityStatus = updates.activityStatus;
      await updateDoc(profileRef, {
        ...updates,
        isVerified: verificationStatus ? verificationStatus === 'verified' : undefined,
        isActive: activityStatus ? activityStatus === 'active' : undefined,
        updatedAt: serverTimestamp(),
      });
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === profileId
            ? {
                ...profile,
                ...updates,
                isVerified:
                  updates.verificationStatus !== undefined
                    ? updates.verificationStatus === 'verified'
                    : profile.isVerified,
                isActive:
                  updates.activityStatus !== undefined
                    ? updates.activityStatus === 'active'
                    : profile.isActive,
              }
            : profile
        )
      );
      addToast({ type: 'success', message: 'Consultant status updated' });
    } catch (error) {
      console.error('Error updating consultant status:', error);
      addToast({ type: 'error', message: 'Failed to update consultant status' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Consultant Management</h1>
        <p className="text-gray-600">Review applications, verify consultants, and manage activity status.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'applications'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('consultants')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'consultants'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Consultants ({profiles.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      ) : activeTab === 'applications' ? (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialties</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Documents</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{app.name}</p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.specialties?.join(', ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.documents && app.documents.length > 0 ? (
                          <ul className="space-y-1">
                            {app.documents.map((docItem, idx) => (
                              <li key={`${docItem.url}-${idx}`}>
                                <a
                                  href={docItem.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-700 hover:underline"
                                >
                                  {docItem.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          'No documents'
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">{app.status}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.createdAt?.toDate
                          ? formatDistanceToNow(app.createdAt.toDate(), { addSuffix: true })
                          : 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleUpdateApplicationStatus(
                              app.id!,
                              e.target.value as ConsultantApplication['status']
                            )
                          }
                          disabled={updatingId === app.id}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {profiles.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No consultant profiles yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Consultant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Verification</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Activity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{profile.name}</p>
                        <p className="text-xs text-gray-500">{profile.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={profile.verificationStatus || (profile.isVerified ? 'verified' : 'unverified')}
                          onChange={(e) =>
                            handleUpdateProfileStatus(profile.id!, {
                              verificationStatus: e.target.value as ConsultantProfile['verificationStatus'],
                            })
                          }
                          disabled={updatingId === profile.id}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="verified">Verified</option>
                          <option value="unverified">Unverified</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={profile.activityStatus || (profile.isActive ? 'active' : 'inactive')}
                          onChange={(e) =>
                            handleUpdateProfileStatus(profile.id!, {
                              activityStatus: e.target.value as ConsultantProfile['activityStatus'],
                            })
                          }
                          disabled={updatingId === profile.id}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {profile.updatedAt?.toDate
                          ? formatDistanceToNow(profile.updatedAt.toDate(), { addSuffix: true })
                          : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
