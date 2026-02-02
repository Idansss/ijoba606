import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'round_screen.dart';

enum QuizLevel { level1, level2, level3 }

class PlayScreen extends StatefulWidget {
  const PlayScreen({super.key});

  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  QuizLevel _selectedLevel = QuizLevel.level1;
  bool _loading = false;
  int? _lastScore;

  @override
  void initState() {
    super.initState();
    _loadLastScore();
  }

  Future<void> _loadLastScore() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final roundsRef = FirebaseFirestore.instance.collection('rounds');
    final snap = await roundsRef
        .where('uid', isEqualTo: user.uid)
        .orderBy('finishedAt', descending: true)
        .limit(1)
        .get();

    if (snap.docs.isNotEmpty) {
      final data = snap.docs.first.data();
      setState(() {
        _lastScore = (data['totalScore'] as num?)?.toInt();
      });
    }
  }

  Future<void> _startRound() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to play.')),
      );
      return;
    }

    setState(() {
      _loading = true;
    });

    try {
      final levelNumber = _selectedLevel == QuizLevel.level1
          ? 1
          : _selectedLevel == QuizLevel.level2
              ? 2
              : 3;

      final questionsRef =
          FirebaseFirestore.instance.collection('questions');
      final q = await questionsRef
          .where('level', isEqualTo: levelNumber)
          .get();

      if (q.docs.length < 3) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Not enough questions for this level. Contact an admin.',
            ),
          ),
        );
        return;
      }

      final all = q.docs
          .map((d) => {'id': d.id, ...d.data()})
          .toList(growable: false);
      all.shuffle();
      final selected = all.take(3).toList();

      if (!mounted) return;

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => RoundScreen(
            level: levelNumber,
            questions: selected,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start round: $e')),
      );
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

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Play')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  '3 questions per round, rewards that stick.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'Sign in to earn streaks, badges, and climb the leaderboard.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                  ),
                ),
                SizedBox(height: 24),
                Text(
                  'Use the sign-in screen to get started, then return here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Play'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Round builder',
              style: TextStyle(
                fontSize: 12,
                letterSpacing: 2,
                fontWeight: FontWeight.w600,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Learn PAYE in snackable sprints.',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Each round is 3 questions. +10 for correct, +2 for giving it a shot.',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
            if (_lastScore != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                  color: const Color(0xFFE0F2FE),
                ),
                child: Text(
                  'Last round score: $_lastScore / 30',
                  style: const TextStyle(
                    color: Color(0xFF1D4ED8),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            const Text(
              'Choose a level',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'New content drops weekly. Unlock higher levels by maintaining stronger averages.',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildLevelCard(
                  level: QuizLevel.level1,
                  label: 'Level 1',
                  description: 'Foundation PAYE concepts',
                ),
                _buildLevelCard(
                  level: QuizLevel.level2,
                  label: 'Level 2',
                  description: 'Intermediate scenarios',
                ),
                _buildLevelCard(
                  level: QuizLevel.level3,
                  label: 'Level 3',
                  description: 'Boss-level challenges',
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _startRound,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                  ),
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                ),
                child: Text(
                  _loading ? 'Loading round...' : 'Start round',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tip: Daily play keeps your streak alive and unlocks rare badges faster.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLevelCard({
    required QuizLevel level,
    required String label,
    required String description,
  }) {
    final selected = _selectedLevel == level;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedLevel = level;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected
                  ? const Color(0xFF7C3AED)
                  : const Color(0xFFE2E8F0),
            ),
            color: selected
                ? const Color(0xFFEEF2FF)
                : Colors.white,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? const Color(0xFF4C1D95)
                      : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

