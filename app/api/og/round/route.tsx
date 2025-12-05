import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '0';
  const level = searchParams.get('level') || '1';
  const streak = searchParams.get('streak') || '0';

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 20px 0',
            }}
          >
            ijoba 606
          </h1>
          
          <div style={{ fontSize: '48px', margin: '20px 0' }}>
            🎓
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#1a202c',
              margin: '20px 0',
            }}
          >
            {score}/30 Points
          </div>

          <div
            style={{
              fontSize: '32px',
              color: '#4a5568',
              margin: '10px 0',
            }}
          >
            Level {level} Quiz • {streak} Day Streak 🔥
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#718096',
              marginTop: '30px',
            }}
          >
            Fit top am? 💪
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

