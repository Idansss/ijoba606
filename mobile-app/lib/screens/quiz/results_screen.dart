import 'package:flutter/material.dart';

class ResultsScreen extends StatelessWidget {
  final int level;
  final int totalScore;
  final int correctCount;
  final int totalQuestions;

  const ResultsScreen({
    super.key,
    required this.level,
    required this.totalScore,
    required this.correctCount,
    required this.totalQuestions,
  });

  @override
  Widget build(BuildContext context) {
    final maxScore = totalQuestions * 10;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Results'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 16),
            const Text(
              'Round complete',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Level $level · $totalQuestions-question sprint',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 24),
            _ScoreMeter(
              score: totalScore,
              maxScore: maxScore,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                _statCard(
                  label: 'Correct answers',
                  value: '$correctCount',
                  bg: const Color(0xFFECFDF3),
                  border: const Color(0xFFBBF7D0),
                  text: const Color(0xFF15803D),
                ),
                _statCard(
                  label: 'Attempted',
                  value: '$totalQuestions',
                  bg: const Color(0xFFE0F2FE),
                  border: const Color(0xFFBFDBFE),
                  text: const Color(0xFF1D4ED8),
                ),
                _statCard(
                  label: 'Total points',
                  value: '$totalScore',
                  bg: const Color(0xFFF3E8FF),
                  border: const Color(0xFFE9D5FF),
                  text: const Color(0xFF7C3AED),
                ),
              ],
            ),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                      backgroundColor: const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text(
                      'Play another round',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Need a breather? Jump to the forum in the main app for explanations.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _statCard({
    required String label,
    required String value,
    required Color bg,
    required Color border,
    required Color text,
  }) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: border),
          color: bg,
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: text,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF4B5563),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScoreMeter extends StatelessWidget {
  final int score;
  final int maxScore;

  const _ScoreMeter({
    required this.score,
    required this.maxScore,
  });

  @override
  Widget build(BuildContext context) {
    final fraction = (score / maxScore).clamp(0.0, 1.0);

    return Column(
      children: [
        SizedBox(
          height: 140,
          width: 140,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: fraction,
                strokeWidth: 10,
                backgroundColor: const Color(0xFFE5E7EB),
                valueColor: const AlwaysStoppedAnimation<Color>(
                  Color(0xFF7C3AED),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$score',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    '/$maxScore',
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
        const SizedBox(height: 8),
        Text(
          'Score: $score / $maxScore',
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF4B5563),
          ),
        ),
      ],
    );
  }
}

