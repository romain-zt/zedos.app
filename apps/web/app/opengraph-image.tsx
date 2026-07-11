import { ImageResponse } from 'next/og';

export const alt = 'Zedos — A better foundation for your wellness business';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const palette = {
  canvas: '#f7f5ef',
  ink: '#19302c',
  forest: '#2e514a',
  sage: '#afc4af',
  clay: '#c26b5a',
  paper: '#ede9df',
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: palette.canvas,
          color: palette.ink,
          padding: 64,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: palette.ink,
              color: palette.canvas,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Z
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>
            zedos<span style={{ color: palette.clay }}>.</span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              border: `1px solid ${palette.sage}`,
              borderRadius: 999,
              padding: '10px 18px',
              color: palette.forest,
              fontSize: 18,
            }}
          >
            Private pilot for wellness businesses
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 60 }}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div style={{ display: 'flex', maxWidth: 720, fontSize: 70, lineHeight: 1.02 }}>
              A better foundation for your wellness business.
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 30,
                color: palette.forest,
                fontSize: 25,
              }}
            >
              Website · Booking · Freedom to grow
            </div>
          </div>

          <div
            style={{
              width: 310,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              border: `1px solid ${palette.sage}`,
              borderRadius: 28,
              background: 'white',
              padding: 24,
              boxShadow: '0 22px 60px rgba(25,48,44,0.12)',
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 700 }}>
              Your client journey
            </div>
            {['Discover', 'Choose', 'Book', 'Return'].map((label, index) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 14,
                  background: index === 2 ? palette.sage : palette.paper,
                  padding: '11px 14px',
                  fontSize: 16,
                }}
              >
                <span style={{ color: palette.clay }}>0{index + 1}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
