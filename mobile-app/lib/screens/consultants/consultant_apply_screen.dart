import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class ConsultantApplyScreen extends StatefulWidget {
  const ConsultantApplyScreen({super.key});

  @override
  State<ConsultantApplyScreen> createState() => _ConsultantApplyScreenState();
}

class _ConsultantApplyScreenState extends State<ConsultantApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _locationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _bioController = TextEditingController();
  bool _submitting = false;

  final List<String> _specialties = [];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _locationController.dispose();
    _experienceController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to submit an application')),
      );
      return;
    }

    if (!_formKey.currentState!.validate() || _specialties.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete all fields and select at least one specialty.'),
        ),
      );
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      final applicationsRef =
          FirebaseFirestore.instance.collection('consultantApplications');

      await applicationsRef.add({
        'uid': user.uid,
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'whatsapp': _whatsappController.text.trim(),
        'locationState': _locationController.text.trim(),
        'experienceYears': int.tryParse(_experienceController.text.trim()) ?? 0,
        'specialties': _specialties,
        'bio': _bioController.text.trim(),
        'status': 'pending',
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Application submitted! You will be contacted after review.'),
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit application: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply as Consultant'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Share your experience',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Tell us about your tax expertise. Approved profiles appear in the public directory.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),
              _buildTextField(
                label: 'Full name',
                controller: _nameController,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter your name' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter your email' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Phone number',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter your phone' : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'WhatsApp (optional)',
                controller: _whatsappController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Location (State)',
                controller: _locationController,
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Enter your location'
                    : null,
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Years of experience',
                controller: _experienceController,
                keyboardType: TextInputType.number,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Enter years of experience' : null,
              ),
              const SizedBox(height: 12),
              const Text(
                'Specialties',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  'PAYE',
                  'Reliefs',
                  'Filing',
                  'Employment Tax',
                  'Tax Planning',
                  'Compliance',
                  'Audit Support',
                ].map((s) {
                  final selected = _specialties.contains(s);
                  return FilterChip(
                    selected: selected,
                    label: Text(s),
                    onSelected: (value) {
                      setState(() {
                        if (value) {
                          _specialties.add(s);
                        } else {
                          _specialties.remove(s);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              _buildTextField(
                label: 'Short bio',
                controller: _bioController,
                maxLines: 5,
                validator: (v) =>
                    v == null || v.trim().length < 50
                        ? 'Tell us at least 50 characters about your experience'
                        : null,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                  ),
                  child: Text(
                    _submitting ? 'Submitting...' : 'Submit application',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: maxLines,
          decoration: const InputDecoration(
            isDense: true,
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }
}

