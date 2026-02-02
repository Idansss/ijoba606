import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ThreadDetailScreenArgs {
  final String threadId;

  ThreadDetailScreenArgs({required this.threadId});
}

class ThreadDetailScreen extends StatefulWidget {
  static const routeName = '/thread';

  final ThreadDetailScreenArgs args;

  const ThreadDetailScreen({super.key, required this.args});

  @override
  State<ThreadDetailScreen> createState() => _ThreadDetailScreenState();
}

class _ThreadDetailScreenState extends State<ThreadDetailScreen> {
  final _replyController = TextEditingController();
  bool _posting = false;

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _postReply() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to reply')),
      );
      return;
    }

    final body = _replyController.text.trim();
    if (body.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reply must be at least 10 characters'),
        ),
      );
      return;
    }

    setState(() {
      _posting = true;
    });

    try {
      final tid = widget.args.threadId;
      final postsRef = FirebaseFirestore.instance.collection('forumPosts');

      await postsRef.add({
        'tid': tid,
        'uid': user.uid,
        'bodyMD': body,
        'votes': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'isHidden': false,
      });

      _replyController.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reply posted')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to post reply: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _posting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final threadId = widget.args.threadId;

    final threadRef = FirebaseFirestore.instance
        .collection('forumThreads')
        .doc(threadId);

    final postsQuery = FirebaseFirestore.instance
        .collection('forumPosts')
        .where('tid', isEqualTo: threadId)
        .orderBy('createdAt', descending: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thread'),
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
              stream: threadRef.snapshots(),
              builder: (context, threadSnap) {
                if (threadSnap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (!threadSnap.hasData || !threadSnap.data!.exists) {
                  return const Center(child: Text('Thread not found'));
                }

                final thread = threadSnap.data!.data()!;
                final title = thread['title'] as String? ?? 'No title';
                final body = thread['bodyMD'] as String? ?? '';
                final isLocked = thread['isLocked'] as bool? ?? false;

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          Text(body),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                        stream: postsQuery.snapshots(),
                        builder: (context, postsSnap) {
                          if (postsSnap.connectionState ==
                              ConnectionState.waiting) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          final docs = postsSnap.data?.docs ?? [];

                          if (docs.isEmpty) {
                            return const Center(
                              child: Text('No replies yet'),
                            );
                          }

                          return ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: docs.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final data = docs[index].data();
                              final body = data['bodyMD'] as String? ?? '';

                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  color: Colors.grey.shade100,
                                ),
                                child: Text(body),
                              );
                            },
                          );
                        },
                      ),
                    ),
                    if (isLocked)
                      Container(
                        width: double.infinity,
                        color: Colors.red.shade50,
                        padding: const EdgeInsets.all(12),
                        child: const Text(
                          'This thread is locked. New replies are disabled.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _replyController,
                    decoration: const InputDecoration(
                      hintText: 'Write a reply...',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    minLines: 1,
                    maxLines: 4,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: _posting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  onPressed: _posting ? null : _postReply,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

