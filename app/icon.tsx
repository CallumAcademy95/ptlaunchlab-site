import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#072B4A',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#F5C518',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            fontFamily: 'sans-serif',
          }}
        >
          PL
        </span>
      </div>
    ),
    { ...size }
  )
}
