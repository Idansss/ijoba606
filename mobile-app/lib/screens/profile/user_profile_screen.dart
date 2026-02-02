import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  Map<String, dynamic>? _userDoc;
  Map<String, dynamic>? _profileDoc;
  List<Map<String, dynamic>> _calcRuns = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() {
        _loading = false;
      });
      return;
    }

    try {
      final db = FirebaseFirestore.instance;

      final userRef = db.collection('users').doc(user.uid);
      final profileRef = db.collection('profiles').doc(user.uid);
      final runsRef = db
          .collection('calcRuns')
          .where('uid', isEqualTo: user.uid)
          .orderBy('createdAt', descending: true)
          .limit(10);

      final userSnap = await userRef.get();
      final profileSnap = await profileRef.get();
      final runsSnap = await runsRef.get();

      setState(() {
        _userDoc =
            userSnap.exists ? {'id': userSnap.id, ...userSnap.data()!} : null;
        _profileDoc = profileSnap.exists
            ? {'id': profileSnap.id, ...profileSnap.data()!}
            : null;
        _calcRuns = runsSnap.docs
            .map((d) => {'id': d.id, ...d.data()})
            .toList(growable: false);
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final firebaseUser = FirebaseAuth.instance.currentUser;

    if (firebaseUser == null) {
      return const Scaffold(
        body: Center(
          child: Text('Please sign in to view your profile.'),
        ),
      );
    }

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_userDoc == null || _profileDoc == null) {
      return const Scaffold(
        body: Center(
          child: Text('Profile not found. Play a round on the web app first.'),
        ),
      );
    }

    final handle = _userDoc!['handle'] as String? ?? firebaseUser.uid;
    final anon = _userDoc!['anon'] as bool? ?? false;
    final totalPoints = _profileDoc!['totalPoints'] as int? ?? 0;
    final levelUnlocked = _profileDoc!['levelUnlocked'] as int? ?? 1;
    final badges =
        (_profileDoc!['badges'] as List<dynamic>? ?? []).cast<String>();
    final bestStreak = _profileDoc!['bestStreak'] as int? ?? 0;
    final streakCount = _profileDoc!['streakCount'] as int? ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  Container(
                    height: 72,
                    width: 72,
                    decoration: const BoxDecoration(
                      borderRadius: BorderRadius.all(Radius.circular(24)),
                      gradient: LinearGradient(
                        colors: [
                          Color(0xFF7C3AED),
                          Color(0xFF3B82F6),
                        ],
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      handle.isNotEmpty ? handle[0].toUpperCase() : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    handle,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  if (anon)
                    const Text(
                      'Guest account',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 2,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _statTile('Total points', totalPoints.toString()),
                _statTile('Level unlocked', levelUnlocked.toString()),
                _statTile('Badges earned', badges.length.toString()),
                _statTile('Best streak', bestStreak.toString()),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                color: Colors.white,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Streak',
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 2,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      Text(
                        '$streakCount days',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                color: Colors.white,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Badge shelf',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (badges.isEmpty)
                    const Text(
                      'No badges yet. Play a round to start unlocking them.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: badges
                          .map(
                            (b) => Chip(
                              label: Text(b),
                              backgroundColor: const Color(0xFFF3E8FF),
                              labelStyle: const TextStyle(
                                color: Color(0xFF7C3AED),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
            ),
            if (_calcRuns.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  color: Colors.white,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Recent tax calculations',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Column(
                      children: _calcRuns.map((run) {
                        final createdAt = run['createdAt'];
                        String dateText = '';
                        if (createdAt is Timestamp) {
                          dateText = createdAt.toDate().toLocal().toString();
                        }
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                            color: Colors.white,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Saved run',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              Text(
                                dateText,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statTile(String label, String value) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          color: Colors.white,
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 10,
                letterSpacing: 1.8,
                color: Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

