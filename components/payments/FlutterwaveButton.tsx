'use client';

import { useEffect, useState } from 'react';

interface FlutterwaveButtonProps {
  publicKey: string;
  email: string;
  amount: number; // in NGN
  currency?: string;
  metadata?: Record<string, any>;
  text?: string;
  onSuccess: (response: FlutterwaveResponse) => void;
  onClose?: () => void;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveOptions) => void;
  }
}

interface FlutterwaveOptions {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
  };
  metadata?: Record<string, any>;
  callback: (data: FlutterwaveResponse) => void;
  onclose: () => void;
}

export interface FlutterwaveResponse {
  status: string;
  transaction_id: number;
  tx_ref: string;
  amount?: number;
  currency?: string;
}

export function FlutterwaveButton({
  publicKey,
  email,
  amount,
  currency = 'NGN',
  metadata,
  text = 'Pay Now',
  onSuccess,
  onClose,
  className = '',
  disabled = false,
}: FlutterwaveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Flutterwave script');
    };
    document.body.appendChild(script);
  }, []);

  const handleClick = () => {
    if (disabled || loading || !scriptLoaded || !publicKey || !email || amount <= 0) {
      return;
    }

    if (!window.FlutterwaveCheckout) {
      console.error('Flutterwave script is not available');
      return;
    }

    setLoading(true);
    const txRef = `IJ606_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount,
        currency,
        customer: { email },
        metadata: metadata || {},
        callback: (response) => {
          setLoading(false);
          onSuccess(response);
        },
        onclose: () => {
          setLoading(false);
          onClose?.();
        },
      });
    } catch (error) {
      console.error('Error initializing Flutterwave payment:', error);
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
