import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/brief': ['./coach/**/*'],
    '/api/prospect': ['./coach/**/*'],
    '/api/debrief': ['./coach/**/*'],
    '/api/generate-persona': ['./coach/**/*'],
  },
}

export default nextConfig
