import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'results_screen.dart';

class RoundScreen extends StatefulWidget {
  final int level;
  final List<Map<String, dynamic>> questions;

  const RoundScreen({
    super.key,
    required this.level,
    required this.questions,
  });

  @override
  State<RoundScreen> createState() => _RoundScreenState();
}

class _RoundScreenState extends State<RoundScreen> {
  int _currentIndex = 0;
  final List<List<int>> _answers = [[], [], []];
  List<int> _selected = [];
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    final q = widget.questions[_currentIndex];
    final isMulti = (q['type'] as String?) == 'multi';
    final options = (q['options'] as List<dynamic>).cast<String>();
    final correct = (q['correct'] as List<dynamic>).cast<int>();
    final prompt = q['prompt'] as String? ?? '';
    final topic = q['topic'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text('Question ${_currentIndex + 1} of ${widget.questions.length}'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              prompt,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            if (topic.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                topic,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
            if (isMulti) ...[
              const SizedBox(height: 8),
              const Text(
                'Multiple answers may be correct.',
                style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 1.5,
                  color: Color(0xFF7C3AED),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final selected = _selected.contains(index);
                  final isCorrect = correct.contains(index);
                  Color borderColor = const Color(0xFFE2E8F0);
                  Color bg = Colors.white;

                  if (_revealed) {
                    if (isCorrect && selected) {
                      borderColor = const Color(0xFF22C55E);
                      bg = const Color(0xFFECFDF3);
                    } else if (!isCorrect && selected) {
                      borderColor = const Color(0xFFEF4444);
                      bg = const Color(0xFFFEF2F2);
                    } else if (isCorrect && !selected) {
                      borderColor = const Color(0xFF22C55E);
                      bg = const Color(0xFFDCFCE7);
                    }
                  } else if (selected) {
                    borderColor = const Color(0xFF7C3AED);
                    bg = const Color(0xFFEEF2FF);
                  }

                  return GestureDetector(
                    onTap: _revealed
                        ? null
                        : () {
                            setState(() {
                              if (isMulti) {
                                if (_selected.contains(index)) {
                                  _selected.remove(index);
                                } else {
                                  _selected.add(index);
                                }
                              } else {
                                _selected = [index];
                              }
                            });
                          },
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderColor),
                        color: bg,
                      ),
                      child: Row(
                        children: [
                          Container(
                            height: 24,
                            width: 24,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: selected
                                    ? const Color(0xFF7C3AED)
                                    : const Color(0xFFD1D5DB),
                              ),
                              color: selected
                                  ? const Color(0xFF7C3AED)
                                  : Colors.white,
                            ),
                            child: Text(
                              String.fromCharCode(65 + index),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: selected
                                    ? Colors.white
                                    : const Color(0xFF4B5563),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              options[index],
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF111827),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _onPrimaryPressed,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                  ),
                  backgroundColor: _revealed
                      ? const Color(0xFF22C55E)
                      : const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                ),
                child: Text(
                  _revealed
                      ? (_currentIndex == widget.questions.length - 1
                          ? 'View results'
                          : 'Next question')
                      : 'Submit answer',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isMulti
                  ? 'Multiple answers may be correct.'
                  : 'Only one answer is correct.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onPrimaryPressed() {
    if (!_revealed) {
      if (_selected.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an answer first.')),
        );
        return;
      }

      setState(() {
        _answers[_currentIndex] = List<int>.from(_selected);
        _revealed = true;
      });
      return;
    }

    if (_currentIndex == widget.questions.length - 1) {
      _submitRound();
    } else {
      setState(() {
        _currentIndex++;
        _selected = [];
        _revealed = false;
      });
    }
  }

  Future<void> _submitRound() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final now = Timestamp.now();
    final roundRef = FirebaseFirestore.instance.collection('rounds').doc();

    final answersPayload = <Map<String, dynamic>>[];
    for (var i = 0; i < widget.questions.length; i++) {
      final q = widget.questions[i];
      final questionId = q['id'] as String? ?? '';
      final correct = (q['correct'] as List<dynamic>).cast<int>();
      final selected = _answers[i];
      final isCorrect = _listsEqual(
        [...correct]..sort(),
        [...selected]..sort(),
      );
      answersPayload.add({
        'questionId': questionId,
        'selectedOptions': selected,
        'isCorrect': isCorrect,
        'attempted': selected.isNotEmpty,
      });
    }

    int totalScore = 0;
    int correctCount = 0;
    for (final a in answersPayload) {
      final isCorrect = a['isCorrect'] == true;
      if (isCorrect) {
        totalScore += 10;
        correctCount += 1;
      } else if ((a['attempted'] as bool? ?? false)) {
        totalScore += 2;
      }
    }

    await roundRef.set({
      'uid': user.uid,
      'level': widget.level,
      'questionIds':
          widget.questions.map((q) => q['id'] as String? ?? '').toList(),
      'correctCount': correctCount,
      'attemptCount': answersPayload.length,
      'totalScore': totalScore,
      'startedAt': now,
      'finishedAt': now,
      'answers': answersPayload,
    });

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ResultsScreen(
          level: widget.level,
          totalScore: totalScore,
          correctCount: correctCount,
          totalQuestions: widget.questions.length,
        ),
      ),
    );
  }

  bool _listsEqual(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

