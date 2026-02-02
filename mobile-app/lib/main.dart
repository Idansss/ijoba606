import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import 'firebase_options.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/forum/thread_detail_screen.dart';
import 'screens/auth/sign_in_screen.dart';
import 'screens/main/main_tab_scaffold.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    // If Firebase initialization fails, we'll show an error screen
    debugPrint('Firebase initialization error: $e');
  }

  runApp(const IjobaMobileApp());
}

class IjobaMobileApp extends StatelessWidget {
  const IjobaMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ijoba606',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.purple,
          primary: Colors.purple.shade600,
          secondary: Colors.blue.shade500,
        ),
        useMaterial3: true,
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.purple.shade600,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.purple.shade600,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      // Show splash screen first, then check auth state
      home: Builder(
        builder: (context) {
          // Check if Firebase is properly configured
          try {
            final options = DefaultFirebaseOptions.currentPlatform;
            final isConfigured = options.apiKey != 'YOUR_FIREBASE_API_KEY_HERE' &&
                options.projectId != 'YOUR_FIREBASE_PROJECT_ID_HERE';
            
            if (!isConfigured) {
              return Scaffold(
                body: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Firebase Not Configured',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Please configure Firebase in lib/firebase_options.dart',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            // Show instructions
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Setup Instructions'),
                                content: const Text(
                                  '1. Open lib/firebase_options.dart\n'
                                  '2. Replace placeholder values with your Firebase config\n'
                                  '3. Get values from Firebase Console or your .env file\n'
                                  '4. Restart the app',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('OK'),
                                  ),
                                ],
                              ),
                            );
                          },
                          child: const Text('Show Instructions'),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }
          } catch (e) {
            debugPrint('Error checking Firebase config: $e');
          }

          return StreamBuilder<User?>(
            stream: FirebaseAuth.instance.authStateChanges(),
            builder: (context, snapshot) {
              // Show splash screen while checking auth state
              if (snapshot.connectionState == ConnectionState.waiting) {
                return SplashScreen(
                  nextScreen: const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  ),
                );
              }

              // Handle errors
              if (snapshot.hasError) {
                return Scaffold(
                  body: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Error: ${snapshot.error}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            // Try to show sign in screen anyway
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(
                                builder: (_) => const SignInScreen(),
                              ),
                            );
                          },
                          child: const Text('Continue Anyway'),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final user = snapshot.data;

              // Show splash screen, then navigate to sign in or main app
              return SplashScreen(
                nextScreen: user == null
                    ? const SignInScreen()
                    : const MainTabScaffold(),
              );
            },
          );
        },
      ),
      onGenerateRoute: (settings) {
        if (settings.name == ThreadDetailScreen.routeName) {
          final args = settings.arguments as ThreadDetailScreenArgs;
          return MaterialPageRoute(
            builder: (_) => ThreadDetailScreen(args: args),
          );
        }

        return null;
      },
    );
  }
}

