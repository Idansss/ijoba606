import 'package:flutter/material.dart';
import '../forum/thread_list_screen.dart';
import '../quiz/play_screen.dart';
import '../leaderboard/leaderboard_screen.dart';
import '../consultants/consultant_browse_screen.dart';
import '../dashboard/user_dashboard_screen.dart';
import '../profile/user_profile_screen.dart';

/// Main tab scaffold with bottom navigation bar
/// Mirrors the web app's navigation structure
class MainTabScaffold extends StatefulWidget {
  const MainTabScaffold({super.key});

  @override
  State<MainTabScaffold> createState() => _MainTabScaffoldState();
}

class _MainTabScaffoldState extends State<MainTabScaffold> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const ThreadListScreen(),
    const PlayScreen(),
    const LeaderboardScreen(),
    const ConsultantBrowseScreen(),
    const UserDashboardScreen(),
  ];

  final List<BottomNavigationBarItem> _navItems = [
    const BottomNavigationBarItem(
      icon: Icon(Icons.forum_outlined),
      activeIcon: Icon(Icons.forum),
      label: 'Forum',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.quiz_outlined),
      activeIcon: Icon(Icons.quiz),
      label: 'Quiz',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.emoji_events_outlined),
      activeIcon: Icon(Icons.emoji_events),
      label: 'Leaderboard',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.business_center_outlined),
      activeIcon: Icon(Icons.business_center),
      label: 'Consultants',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.dashboard_outlined),
      activeIcon: Icon(Icons.dashboard),
      label: 'Dashboard',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          selectedItemColor: Colors.purple.shade600,
          unselectedItemColor: Colors.grey.shade600,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          items: _navItems,
          elevation: 8,
        ),
      ),
      appBar: AppBar(
        title: const Text(
          'IJOBA 606',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const UserProfileScreen(),
                ),
              );
            },
            tooltip: 'Profile',
          ),
        ],
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.purple.shade600,
                Colors.blue.shade500,
              ],
            ),
          ),
        ),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
}
