import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthlyTax = searchParams.get('tax') || '0';
  const effectiveRate = searchParams.get('rate') || '0';

  const formattedTax = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(monthlyTax));

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '60px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 20px 0',
            }}
          >
            ijoba 606
          </h1>
          
          <div style={{ fontSize: '48px', margin: '20px 0' }}>
            🧮
          </div>

          <div
            style={{
              fontSize: '32px',
              color: '#4a5568',
              margin: '10px 0',
            }}
          >
            My Personal Income Tax estimate
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#1a202c',
              margin: '20px 0',
            }}
          >
            {formattedTax}
          </div>

          <div
            style={{
              fontSize: '28px',
              color: '#718096',
              margin: '10px 0',
            }}
          >
            per month • {effectiveRate}% effective rate
          </div>

          <div
            style={{
              fontSize: '20px',
              color: '#a0aec0',
              marginTop: '30px',
              textAlign: 'center',
            }}
          >
            Calculate yours at ijoba606.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

