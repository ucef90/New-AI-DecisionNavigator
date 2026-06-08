/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse / pdfjs-dist / tesseract.js / canvas sont des paquets Node :
    // ne pas les bundler (sinon erreurs de workers / "non-object").
    serverComponentsExternalPackages: [
      "pdf-parse",
      "pdfjs-dist",
      "tesseract.js",
      "@napi-rs/canvas",
    ],
    // Les Server Actions sont limitées à 1 Mo par défaut : on relève pour
    // permettre l'upload de PDF (analyse fournisseur, documents projet).
    serverActions: {
      // Relevé : les PDF scannés (analyse fournisseur / documents) sont lourds.
      bodySizeLimit: "30mb",
    },
  },
}

export default nextConfig
