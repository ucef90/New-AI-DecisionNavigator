/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse / pdfjs-dist sont des paquets Node : ne pas les bundler
    // (sinon erreur "Object.defineProperty called on non-object").
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
    // Les Server Actions sont limitées à 1 Mo par défaut : on relève pour
    // permettre l'upload de PDF (analyse fournisseur, documents projet).
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
}

export default nextConfig
