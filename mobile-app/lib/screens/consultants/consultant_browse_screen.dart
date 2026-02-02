import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'consultant_chat_screen.dart';

class ConsultantBrowseScreen extends StatefulWidget {
  const ConsultantBrowseScreen({super.key});

  @override
  State<ConsultantBrowseScreen> createState() => _ConsultantBrowseScreenState();
}

class _ConsultantBrowseScreenState extends State<ConsultantBrowseScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _consultants = [];
  String _searchQuery = '';
  String _selectedSpecialty = 'all';
  String _sortBy = 'rating'; // rating | experience | clients

  final _specialties = const [
    'all',
    'PAYE',
    'Reliefs',
    'Filing',
    'Employment Tax',
    'Tax Planning',
    'Compliance',
    'Audit Support',
  ];

  @override
  void initState() {
    super.initState();
    _fetchConsultants();
  }

  Future<void> _fetchConsultants() async {
    setState(() {
      _loading = true;
    });

    try {
      final ref =
          FirebaseFirestore.instance.collection('consultantProfiles');

      Query<Map<String, dynamic>> q = ref.where('isActive', isEqualTo: true);

      if (_selectedSpecialty != 'all') {
        q = q.where('specialties', arrayContains: _selectedSpecialty);
      }

      if (_sortBy == 'rating') {
        q = q.orderBy('averageRating', descending: true);
      } else if (_sortBy == 'experience') {
        q = q.orderBy('experienceYears', descending: true);
      } else {
        q = q.orderBy('totalClients', descending: true);
      }

      final snap = await q.limit(50).get();
      final data = snap.docs
          .map((d) => {'id': d.id, ...d.data()})
          .toList(growable: false);

      setState(() {
        _consultants = data;
      });
    } catch (_) {
      // Fallback: fetch all and sort client side
      final ref =
          FirebaseFirestore.instance.collection('consultantProfiles');
      final snap = await ref.get();
      var data = snap.docs
          .map((d) => {'id': d.id, ...d.data()})
          .toList(growable: false);
      data = data.where((c) => (c['isActive'] ?? true) == true).toList();
      if (_selectedSpecialty != 'all') {
        data = data
            .where((c) => (c['specialties'] as List<dynamic>? ?? [])
                .contains(_selectedSpecialty))
            .toList();
      }
      data.sort((a, b) {
        if (_sortBy == 'rating') {
          return ((b['averageRating'] ?? 0) as num)
              .compareTo((a['averageRating'] ?? 0) as num);
        } else if (_sortBy == 'experience') {
          return ((b['experienceYears'] ?? 0) as num)
              .compareTo((a['experienceYears'] ?? 0) as num);
        } else {
          return ((b['totalClients'] ?? 0) as num)
              .compareTo((a['totalClients'] ?? 0) as num);
        }
      });
      setState(() {
        _consultants = data;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    final filtered = _consultants.where((c) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final name = (c['name'] as String? ?? '').toLowerCase();
      final bio = (c['bio'] as String? ?? '').toLowerCase();
      final specialties =
          (c['specialties'] as List<dynamic>? ?? []).map((e) => e.toString());
      return name.contains(q) ||
          bio.contains(q) ||
          specialties.any((s) => s.toLowerCase().contains(q));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Find a Consultant'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildFilters(),
            const SizedBox(height: 16),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(),
                    )
                  : filtered.isEmpty
                      ? const Center(
                          child: Text(
                            'No consultants found matching your criteria.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final c = filtered[index];
                            return _buildConsultantCard(c, user);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        color: Colors.white,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search, size: 20),
                    hintText: 'Search by name, specialty, or expertise...',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedSpecialty,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  items: _specialties
                      .map(
                        (s) => DropdownMenuItem(
                          value: s,
                          child: Text(
                            s == 'all' ? 'All Specialties' : s,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      _selectedSpecialty = value;
                    });
                    _fetchConsultants();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _sortBy,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'rating',
                      child: Text('Sort by Rating'),
                    ),
                    DropdownMenuItem(
                      value: 'experience',
                      child: Text('Sort by Experience'),
                    ),
                    DropdownMenuItem(
                      value: 'clients',
                      child: Text('Sort by Clients'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      _sortBy = value;
                    });
                    _fetchConsultants();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConsultantCard(
    Map<String, dynamic> c,
    User? user,
  ) {
    final id = c['id'] as String?;
    final name = c['name'] as String? ?? 'Consultant';
    final location = c['locationState'] as String?;
    final bio = c['bio'] as String? ?? '';
    final specialties =
        (c['specialties'] as List<dynamic>? ?? []).cast<String>();
    final averageRating = (c['averageRating'] as num?)?.toDouble();
    final reviewsCount = c['reviewsCount'] as int? ?? 0;
    final experienceYears = c['experienceYears'] as int? ?? 0;
    final totalClients = c['totalClients'] as int? ?? 0;
    final hourlyRate = c['hourlyRate'] as num?;
    final isVerified = c['isVerified'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF7C3AED),
                      Color(0xFF3B82F6),
                    ],
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF111827),
                            ),
                          ),
                        ),
                        if (isVerified)
                          const Icon(
                            Icons.verified,
                            size: 18,
                            color: Color(0xFF2563EB),
                          ),
                      ],
                    ),
                    if (location != null && location.isNotEmpty)
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: Color(0xFF6B7280),
                          ),
                          const SizedBox(width: 2),
                          Text(
                            location,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            bio,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: [
              ...specialties.take(3).map(
                    (s) => Chip(
                      label: Text(
                        s,
                        style: const TextStyle(fontSize: 11),
                      ),
                      backgroundColor: const Color(0xFFEDE9FE),
                      labelStyle: const TextStyle(
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ),
              if (specialties.length > 3)
                Chip(
                  label: Text(
                    '+${specialties.length - 3}',
                    style: const TextStyle(fontSize: 11),
                  ),
                  backgroundColor: const Color(0xFFF3F4F6),
                  labelStyle: const TextStyle(
                    color: Color(0xFF4B5563),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.star,
                    size: 16,
                    color: Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 2),
                  Text(
                    averageRating?.toStringAsFixed(1) ?? 'N/A',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '(${reviewsCount})',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Text(
                    '$experienceYears yrs',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$totalClients clients',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (hourlyRate != null) ...[
            const SizedBox(height: 6),
            Text(
              '₦${hourlyRate.toStringAsFixed(0)}/hr',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF7C3AED),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    // For now we just show a message; a full profile screen could be added.
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content:
                            Text('Full consultant profile not implemented yet.'),
                      ),
                    );
                  },
                  child: const Text('View Profile'),
                ),
              ),
              const SizedBox(width: 8),
              if (user != null && id != null)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              ConsultantChatScreen(consultantId: id),
                        ),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('Chat'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      backgroundColor: const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

