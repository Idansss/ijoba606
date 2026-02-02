import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

enum LeaderboardTab { weekly, alltime }

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  LeaderboardTab _activeTab = LeaderboardTab.weekly;
  bool _loading = true;
  List<Map<String, dynamic>> _weeklyEntries = [];
  List<Map<String, dynamic>> _alltimeEntries = [];

  @override
  void initState() {
    super.initState();
    _fetchLeaderboards();
  }

  Future<void> _fetchLeaderboards() async {
    setState(() {
      _loading = true;
    });

    try {
      final weeklyRef = FirebaseFirestore.instance
          .collection('leaderboards')
          .doc('weekly')
          .collection('entries');
      final alltimeRef = FirebaseFirestore.instance
          .collection('leaderboards')
          .doc('alltime')
          .collection('entries');

      final weeklySnap = await weeklyRef
          .orderBy('totalPoints', descending: true)
          .limit(50)
          .get();
      final alltimeSnap = await alltimeRef
          .orderBy('totalPoints', descending: true)
          .limit(50)
          .get();

      final weekly = <Map<String, dynamic>>[];
      for (var i = 0; i < weeklySnap.docs.length; i++) {
        final data = weeklySnap.docs[i].data();
        data['rank'] = i + 1;
        weekly.add(data);
      }

      final alltime = <Map<String, dynamic>>[];
      for (var i = 0; i < alltimeSnap.docs.length; i++) {
        final data = alltimeSnap.docs[i].data();
        data['rank'] = i + 1;
        alltime.add(data);
      }

      setState(() {
        _weeklyEntries = weekly;
        _alltimeEntries = alltime;
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
    final entries =
        _activeTab == LeaderboardTab.weekly ? _weeklyEntries : _alltimeEntries;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Header + tabs (mirrors web gradient pill style)
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'Friendly competition',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Leaderboard',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Top 50 players who keep their streaks and scores blazing.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    color: Colors.white.withOpacity(0.9),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      _buildTabChip(
                        label: 'Weekly sprint',
                        selected: _activeTab == LeaderboardTab.weekly,
                        onTap: () {
                          setState(() {
                            _activeTab = LeaderboardTab.weekly;
                          });
                        },
                      ),
                      _buildTabChip(
                        label: 'All-time legends',
                        selected: _activeTab == LeaderboardTab.alltime,
                        onTap: () {
                          setState(() {
                            _activeTab = LeaderboardTab.alltime;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  color: Colors.white,
                ),
                child: _loading
                    ? const Center(
                        child: Text(
                          'Loading leaderboard...',
                          style: TextStyle(color: Color(0xFF64748B)),
                        ),
                      )
                    : entries.isEmpty
                        ? const Center(
                            child: Text(
                              'No entries yet. Be the first to play today.',
                              style: TextStyle(color: Color(0xFF64748B)),
                              textAlign: TextAlign.center,
                            ),
                          )
                        : ListView.separated(
                            itemCount: entries.length,
                            separatorBuilder: (_, __) => const Divider(
                              height: 1,
                              color: Color(0xFFE2E8F0),
                            ),
                            itemBuilder: (context, index) {
                              final e = entries[index];
                              final rank = e['rank'] as int? ?? (index + 1);
                              final handle = e['handle'] as String? ?? 'Anonymous';
                              final totalPoints =
                                  e['totalPoints'] as int? ?? 0;
                              final bestStreak =
                                  e['bestStreak'] as int? ?? 0;
                              final uid = e['uid'] as String?;
                              final isCurrentUser = uid != null &&
                                  user != null &&
                                  uid == user.uid;
                              final medal = _getMedal(rank);

                              return Container(
                                color: isCurrentUser
                                    ? const Color(0xFFF3E8FF)
                                    : null,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: Row(
                                        children: [
                                          if (medal != null) ...[
                                            Text(
                                              medal,
                                              style:
                                                  const TextStyle(fontSize: 18),
                                            ),
                                            const SizedBox(width: 4),
                                          ],
                                          Text(
                                            '#$rank',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF0F172A),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      flex: 4,
                                      child: Row(
                                        children: [
                                          Container(
                                            height: 36,
                                            width: 36,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              gradient: const LinearGradient(
                                                colors: [
                                                  Color(0xFF7C3AED),
                                                  Color(0xFF3B82F6),
                                                ],
                                              ),
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(
                                              handle.isNotEmpty
                                                  ? handle[0]
                                                      .toUpperCase()
                                                  : '?',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    handle,
                                                    style: TextStyle(
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: isCurrentUser
                                                          ? const Color(
                                                              0xFF7C3AED)
                                                          : const Color(
                                                              0xFF0F172A),
                                                    ),
                                                  ),
                                                  if (isCurrentUser)
                                                    Container(
                                                      margin:
                                                          const EdgeInsets.only(
                                                              left: 6),
                                                      padding:
                                                          const EdgeInsets
                                                              .symmetric(
                                                        horizontal: 6,
                                                        vertical: 2,
                                                      ),
                                                      decoration:
                                                          BoxDecoration(
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(999),
                                                        color: const Color(
                                                            0xFFEDE9FE),
                                                      ),
                                                      child: const Text(
                                                        'You',
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          color: Color(
                                                              0xFF7C3AED),
                                                        ),
                                                      ),
                                                    ),
                                                ],
                                              ),
                                              Text(
                                                'Streak: $bestStreak',
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  letterSpacing: 1.5,
                                                  color: Color(0xFF94A3B8),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            totalPoints
                                                .toString()
                                                .replaceAllMapped(
                                                  RegExp(
                                                      r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                                                  (m) => '${m[1]},',
                                                ),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF0F172A),
                                            ),
                                          ),
                                          Text(
                                            '$bestStreak best streak',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A)),
                color: const Color(0xFFFEF9C3),
              ),
              child: const Text(
                'Leaderboard resets every Monday at 00:05 Africa/Lagos time. The all-time board keeps every point.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF92400E),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: selected
                ? const LinearGradient(
                    colors: [
                      Color(0xFF7C3AED),
                      Color(0xFF3B82F6),
                    ],
                  )
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected
                  ? Colors.white
                  : const Color(
                      0xFF64748B,
                    ),
            ),
          ),
        ),
      ),
    );
  }

  String? _getMedal(int rank) {
    if (rank == 1) return '🥇';
    if (rank == 2) return '🥈';
    if (rank == 3) return '🥉';
    return null;
  }
}

