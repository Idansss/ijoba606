import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'thread_detail_screen.dart';

/// Minimal mobile view of your `forumThreads` collection.
/// It expects the same schema as `ForumThread` in your web app:
/// - `title`, `tags`, `replyCount`, `createdAt`, `isPinned`, etc.
class ThreadListScreen extends StatelessWidget {
  const ThreadListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final threadsQuery = FirebaseFirestore.instance
        .collection('forumThreads')
        .orderBy('createdAt', descending: true);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Forum'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // Trigger a rebuild; the stream auto-updates anyway.
            },
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: threadsQuery.snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text('Error loading threads: ${snapshot.error}'),
            );
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const Center(
              child: Text('No threads yet. Start the first conversation!'),
            );
          }

          return ListView.separated(
            itemCount: docs.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final data = docs[index].data();
              final id = docs[index].id;
              final title = data['title'] as String? ?? 'No title';
              final tags = (data['tags'] as List<dynamic>? ?? [])
                  .map((e) => e.toString())
                  .toList();
              final replyCount = data['replyCount'] as int? ?? 0;
              final isPinned = data['isPinned'] as bool? ?? false;

              DateTime? createdAt;
              final createdField = data['createdAt'];
              if (createdField is Timestamp) {
                createdAt = createdField.toDate();
              }

              return ListTile(
                title: Row(
                  children: [
                    if (isPinned)
                      const Padding(
                        padding: EdgeInsets.only(right: 4),
                        child: Icon(
                          Icons.push_pin,
                          size: 16,
                          color: Colors.deepPurple,
                        ),
                      ),
                    Expanded(child: Text(title)),
                  ],
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (tags.isNotEmpty)
                      Wrap(
                        spacing: 4,
                        children: tags
                            .map(
                              (t) => Chip(
                                label: Text(
                                  t,
                                  style: const TextStyle(fontSize: 11),
                                ),
                                visualDensity: VisualDensity.compact,
                                padding: EdgeInsets.zero,
                              ),
                            )
                            .toList(),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      '$replyCount replies'
                      '${createdAt != null ? ' • ${createdAt.toLocal()}' : ''}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
                onTap: () {
                  Navigator.of(context).pushNamed(
                    ThreadDetailScreen.routeName,
                    arguments: ThreadDetailScreenArgs(threadId: id),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

