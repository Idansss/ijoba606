import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});

  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _invoices = [];
  String _filter = 'all'; // all | pending_payment | in_progress | completed | cancelled

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() {
        _loading = false;
      });
      return;
    }

    setState(() {
      _loading = true;
    });

    try {
      final db = FirebaseFirestore.instance;
      final ref = db.collection('invoices');
      final snap = await ref
          .where('customerUid', isEqualTo: user.uid)
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      setState(() {
        _invoices = snap.docs
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
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(
        body: Center(
          child: Text('Please sign in to view your dashboard.'),
        ),
      );
    }

    final filtered = _invoices.where((invoice) {
      if (_filter == 'all') return true;
      if (_filter == 'pending_payment') {
        final paymentStatus = invoice['paymentStatus'] as String? ?? '';
        final status = invoice['status'] as String? ?? '';
        return paymentStatus == 'pending' || status == 'sent';
      }
      final serviceStatus = invoice['serviceStatus'] as String? ?? '';
      return serviceStatus == _filter;
    }).toList();

    final stats = {
      'Pending payment': _invoices
          .where((i) =>
              (i['paymentStatus'] == 'pending') || (i['status'] == 'sent'))
          .length,
      'In progress': _invoices
          .where((i) => i['serviceStatus'] == 'in_progress')
          .length,
      'Completed': _invoices
          .where((i) => i['serviceStatus'] == 'completed')
          .length,
      'Total': _invoices.length,
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                _statCard('Pending payment', stats['Pending payment'] ?? 0,
                    const Color(0xFFFEF3C7), const Color(0xFFFACC15)),
                _statCard('In progress', stats['In progress'] ?? 0,
                    const Color(0xFFE0F2FE), const Color(0xFF3B82F6)),
                _statCard('Completed', stats['Completed'] ?? 0,
                    const Color(0xFFDCFCE7), const Color(0xFF22C55E)),
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Total requests: ${stats['Total'] ?? 0}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterChip('All', 'all'),
                  _filterChip('Pending payment', 'pending_payment'),
                  _filterChip('In progress', 'in_progress'),
                  _filterChip('Completed', 'completed'),
                  _filterChip('Cancelled', 'cancelled'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? const Center(
                          child: Text(
                            'No invoices yet. Book a consultant on the web to see your history here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final invoice = filtered[index];
                            return _invoiceTile(invoice);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(
    String label,
    int value,
    Color bg,
    Color accent,
  ) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: bg,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 6,
              width: 24,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: accent,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value.toString(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    final selected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) {
          setState(() {
            _filter = value;
          });
        },
      ),
    );
  }

  Widget _invoiceTile(Map<String, dynamic> invoice) {
    final ref = invoice['reference'] as String? ?? invoice['id'] as String? ?? '';
    final status = invoice['serviceStatus'] as String? ?? 'pending';
    final paymentStatus = invoice['paymentStatus'] as String? ?? 'pending';
    final createdAt = invoice['createdAt'];
    String created = '';
    if (createdAt is Timestamp) {
      created = createdAt.toDate().toLocal().toString();
    }

    Color statusColor;
    String statusLabel;
    if (status == 'completed') {
      statusColor = const Color(0xFF16A34A);
      statusLabel = 'Completed';
    } else if (status == 'in_progress') {
      statusColor = const Color(0xFF2563EB);
      statusLabel = 'In progress';
    } else if (status == 'cancelled') {
      statusColor = const Color(0xFFDC2626);
      statusLabel = 'Cancelled';
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusLabel = 'Pending';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                ref,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  color: statusColor.withOpacity(0.1),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    color: statusColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Payment: $paymentStatus',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            created,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }
}

