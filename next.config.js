/** @type {import('next').NextConfig} */
// CAL_PROXY: para onde vai /cal/* (rota /calendario da fleet-api). Em teste local
// e um tunel SSH (http://localhost:8003). Sem a variavel, nenhuma regra e criada.
const nextConfig = {
  async rewrites() {
    const alvo = process.env.CAL_PROXY
    return alvo ? [{ source: '/cal/:path*', destination: `${alvo}/:path*` }] : []
  },
}

module.exports = nextConfig
