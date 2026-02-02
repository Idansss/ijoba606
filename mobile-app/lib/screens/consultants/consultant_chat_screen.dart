import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class ConsultantChatScreen extends StatefulWidget {
  final String consultantId;

  const ConsultantChatScreen({
    super.key,
    required this.consultantId,
  });

  @override
  State<ConsultantChatScreen> createState() => _ConsultantChatScreenState();
}

class _ConsultantChatScreenState extends State<ConsultantChatScreen> {
  Map<String, dynamic>? _consultant;
  Map<String, dynamic>? _chat;
  final List<Map<String, dynamic>> _messages = [];
  final _textController = TextEditingController();
  bool _loading = true;
  bool _sending = false;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _sub;

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  @override
  void dispose() {
    _textController.dispose();
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _initChat() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to start a chat')),
      );
      Navigator.of(context).pop();
      return;
    }

    setState(() {
      _loading = true;
    });

    try {
      final db = FirebaseFirestore.instance;

      // Load consultant profile
      final consultantRef =
          db.collection('consultantProfiles').doc(widget.consultantId);
      final consultantSnap = await consultantRef.get();
      if (!consultantSnap.exists) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Consultant not found')),
        );
        Navigator.of(context).pop();
        return;
      }
      _consultant = {'id': consultantSnap.id, ...consultantSnap.data()!};

      // Find or create chat
      final chatsRef = db.collection('consultantChats');
      final existing = await chatsRef
          .where('consultantUid', isEqualTo: widget.consultantId)
          .where('customerUid', isEqualTo: user.uid)
          .limit(1)
          .get();

      DocumentReference<Map<String, dynamic>> chatRef;
      Map<String, dynamic> chatData;

      if (existing.docs.isNotEmpty) {
        chatRef = existing.docs.first.reference;
        chatData = {'id': chatRef.id, ...existing.docs.first.data()};
      } else {
        chatRef = chatsRef.doc();
        chatData = {
          'consultantUid': widget.consultantId,
          'customerUid': user.uid,
          'consultantName':
              _consultant?['name'] as String? ?? 'Consultant',
          'customerName': 'User', // simple placeholder handle
          'unreadCountConsultant': 0,
          'unreadCountCustomer': 0,
          'status': 'active',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        };
        await chatRef.set(chatData);
        chatData['id'] = chatRef.id;
      }

      _chat = chatData;

      // Subscribe to messages
      _sub?.cancel();
      _sub = db
          .collection('consultantChats')
          .doc(chatRef.id)
          .collection('messages')
          .orderBy('createdAt', descending: false)
          .snapshots()
          .listen((snapshot) {
        final msgs = snapshot.docs
            .map((d) => {'id': d.id, ...d.data()})
            .toList(growable: false);
        setState(() {
          _messages
            ..clear()
            ..addAll(msgs);
        });
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start chat: $e')),
      );
      Navigator.of(context).pop();
      return;
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    final user = FirebaseAuth.instance.currentUser;
    if (text.isEmpty || user == null || _chat == null) return;

    setState(() {
      _sending = true;
    });

    try {
      final db = FirebaseFirestore.instance;
      final chatId = _chat!['id'] as String;
      final messagesRef = db
          .collection('consultantChats')
          .doc(chatId)
          .collection('messages');

      await messagesRef.add({
        'senderUid': user.uid,
        'text': text,
        'createdAt': FieldValue.serverTimestamp(),
      });

      _textController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _sending = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final consultantName =
        _consultant != null ? (_consultant!['name'] as String? ?? '') : '';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          consultantName.isEmpty ? 'Consultant chat' : consultantName,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe =
                          msg['senderUid'] == FirebaseAuth.instance.currentUser?.uid;
                      return Align(
                        alignment: isMe
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            color: isMe
                                ? const Color(0xFF7C3AED)
                                : const Color(0xFFE5E7EB),
                          ),
                          child: Text(
                            msg['text'] as String? ?? '',
                            style: TextStyle(
                              color: isMe ? Colors.white : const Color(0xFF111827),
                              fontSize: 13,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          const Divider(height: 1),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      minLines: 1,
                      maxLines: 4,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sending ? null : _sendMessage,
                    icon: _sending
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

