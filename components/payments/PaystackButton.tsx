'use client';

import { useState, useEffect } from 'react';

interface PaystackButtonProps {
  publicKey: string;
  email: string;
  amount: number; // in kobo
  metadata?: Record<string, any>;
  text?: string;
  onSuccess: (reference: any) => void;
  onClose?: () => void;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  metadata?: Record<string, any>;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
}

export function PaystackButton({
  publicKey,
  email,
  amount,
  metadata,
  text = 'Pay Now',
  onSuccess,
  onClose,
  className = '',
  disabled = false,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Paystack inline script
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script');
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handleClick = () => {
    if (disabled || loading || !scriptLoaded || !publicKey || !email || amount <= 0) {
      return;
    }

    setLoading(true);

    // Generate unique reference
    const reference = `IJ606_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: amount,
        ref: reference,
        metadata: metadata || {},
        callback: (response: PaystackResponse) => {
          setLoading(false);
          onSuccess({
            reference: response.reference,
            status: response.status,
            message: response.message,
            transaction: response.trans || response.transaction,
          });
        },
        onClose: () => {
          setLoading(false);
          onClose?.();
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error('Error initializing Paystack payment:', error);
      setLoading(false);
      onClose?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || !scriptLoaded || !publicKey || !email || amount <= 0}
      className={className}
    >
      {loading ? 'Processing...' : text}
    </button>
  );
}
