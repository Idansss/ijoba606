import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';

/// Splash screen with animated "IJOBA 606" text
/// Shows for 2.5 seconds, then navigates to the next screen
class SplashScreen extends StatefulWidget {
  final Widget nextScreen;

  const SplashScreen({
    super.key,
    required this.nextScreen,
  });

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _scaleController;
  late AnimationController _gradientController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _gradientAnimation;

  @override
  void initState() {
    super.initState();

    // Fade in animation
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    // Scale animation for text
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    // Gradient animation
    _gradientController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: Curves.elasticOut,
      ),
    );

    _gradientAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _gradientController,
        curve: Curves.easeInOut,
      ),
    );

    // Start animations
    _fadeController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      _scaleController.forward();
    });
    _gradientController.repeat(reverse: true);

    // Navigate after 2.5 seconds
    Timer(const Duration(milliseconds: 2500), () {
      if (mounted && context.mounted) {
        try {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => widget.nextScreen),
          );
        } catch (e) {
          debugPrint('Navigation error: $e');
          // Fallback: try to show the next screen anyway
          if (mounted && context.mounted) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => widget.nextScreen),
              (route) => false,
            );
          }
        }
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _scaleController.dispose();
    _gradientController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              Colors.purple.shade50,
              Colors.blue.shade50,
            ],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: AnimatedBuilder(
                animation: _gradientAnimation,
                builder: (context, child) {
                  return ShaderMask(
                    shaderCallback: (bounds) {
                      return LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color.lerp(
                            Colors.purple.shade600,
                            Colors.blue.shade500,
                            _gradientAnimation.value,
                          )!,
                          Color.lerp(
                            Colors.blue.shade500,
                            Colors.purple.shade600,
                            _gradientAnimation.value,
                          )!,
                        ],
                      ).createShader(bounds);
                    },
                    child: const Text(
                      'IJOBA 606',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 4,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
