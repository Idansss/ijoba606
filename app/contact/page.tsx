'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Twitter, 
  Linkedin, 
  Github, 
  Facebook,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { useToastStore } from '@/lib/store/toast';
import { submitContactForm } from '@/lib/firebase/functions';

export default function ContactPage() {
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitContactForm(formData);
      addToast({ type: 'success', message: result.message });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send. Please try info@ijoba606.com directly.';
      addToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'info@ijoba606.com',
      href: 'mailto:info@ijoba606.com',
      color: 'text-[#006d33]',
      bgColor: 'bg-[#c7ecd6]',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+234 (0) 123 456 7890',
      href: 'tel:+2341234567890',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Lagos, Nigeria',
      href: '#',
      color: 'text-[#006400]',
      bgColor: 'bg-[#d3e6c8]',
    },
  ];

  const socialLinks = [
    {
      icon: Twitter,
      label: 'Twitter',
      href: 'https://twitter.com/ijoba606',
      color: 'hover:text-[#25b35f]',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: 'https://linkedin.com/company/ijoba606',
      color: 'hover:text-[#006d33]',
    },
    {
      icon: Github,
      label: 'GitHub',
      href: 'https://github.com/ijoba606',
      color: 'hover:text-gray-400',
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: 'https://facebook.com/ijoba606',
      color: 'hover:text-[#109a48]',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://instagram.com/ijoba606',
      color: 'hover:text-pink-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Get in Touch
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Have questions, feedback, or need support? We&apos;d love to hear from you!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <a
                    key={index}
                    href={info.href}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`${info.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${info.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">{info.label}</p>
                      <p className="text-gray-900 font-medium">{info.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Follow Us</h2>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-[#0b7a3b] transition-all ${social.color} group`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{social.label}</span>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Response */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#0b7a3b] to-[#109a48] rounded-2xl shadow-lg p-6 text-white"
          >
            <MessageCircle className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Quick Response</h3>
            <p className="text-[#d3e6c8] text-sm">
              We typically respond within 24-48 hours. For urgent matters, please call us directly.
            </p>
          </motion.div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b7a3b] focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b7a3b] focus:border-transparent transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b7a3b] focus:border-transparent transition-all"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b7a3b] focus:border-transparent transition-all resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#006400] to-[#006d33] text-white rounded-xl font-bold hover:from-[#004f00] hover:to-[#005728] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center">
                By submitting this form, you agree to our{' '}
                <a href="/legal/privacy" className="text-[#006400] hover:underline">
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a href="/legal/terms" className="text-[#006400] hover:underline">
                  Terms of Service
                </a>
                .
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
