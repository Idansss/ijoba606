'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft, Briefcase, UserCheck, FileText, X } from 'lucide-react';

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
  const [selectedApplication, setSelectedApplication] = useState<ConsultantApplication | null>(null);

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
            averageRating: 0,
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
      const updatePayload: Partial<ConsultantProfile> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
        updatedAt: serverTimestamp(),
      };

      if (verificationStatus) {
        updatePayload.verificationStatus = verificationStatus;
        updatePayload.isVerified = verificationStatus === 'verified';
      }

      if (activityStatus) {
        updatePayload.activityStatus = activityStatus;
        updatePayload.isActive = activityStatus === 'active';
      }

      await updateDoc(profileRef, updatePayload);
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
      <div className="max-w-6xl mx-auto">
        <AdminBreadcrumb items={[{ label: 'Consultant Management' }]} />

        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Consultant
            </span>{' '}
            <span className="text-gray-900">Management</span>
          </h1>
          <p className="text-gray-600">
            Review applications, verify consultants, and manage activity status.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Total: {applications.length} application(s), {profiles.length} consultant(s)
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'applications'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('consultants')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'consultants'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Consultants ({profiles.length})
          </button>
        </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      ) : activeTab === 'applications' ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
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
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            app.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.createdAt?.toDate
                          ? formatDistanceToNow(app.createdAt.toDate(), { addSuffix: true })
                          : 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedApplication(app)}
                          className="mr-3 text-xs font-semibold text-purple-700 hover:underline"
                        >
                          View
                        </button>
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {profiles.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No consultant profiles yet.</p>
              <p className="text-sm text-gray-400 mt-1">Approve an application to create a profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
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

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500">{selectedApplication.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Name</p>
                <p>{selectedApplication.name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Phone</p>
                <p>{selectedApplication.phone}</p>
              </div>
              {selectedApplication.whatsapp && (
                <div>
                  <p className="font-semibold text-gray-900">WhatsApp</p>
                  <p>{selectedApplication.whatsapp}</p>
                </div>
              )}
              {selectedApplication.locationState && (
                <div>
                  <p className="font-semibold text-gray-900">Location / State</p>
                  <p>{selectedApplication.locationState}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">Experience</p>
                <p>{selectedApplication.experienceYears ?? 0} years</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Specialties</p>
                <p>{selectedApplication.specialties?.join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Bio</p>
                <p className="whitespace-pre-line text-gray-600">{selectedApplication.bio}</p>
              </div>
              {selectedApplication.credentialsUrl && (
                <div>
                  <p className="font-semibold text-gray-900">Credentials URL</p>
                  <a
                    href={selectedApplication.credentialsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 hover:underline"
                  >
                    {selectedApplication.credentialsUrl}
                  </a>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">Documents</p>
                {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {selectedApplication.documents.map((docItem, idx) => (
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
                  <p className="text-gray-500">No documents</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
