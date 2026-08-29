import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://nexjoob.nexadigic.cm';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function SEO({ title, description, path = '', image, type = 'website', jsonLd }) {
  const fullTitle = title ? `${title} | nexjoob` : 'nexjoob - Trouvez le job idéal au Cameroun';
  const fullUrl = `${SITE_URL}${path}`;
  const metaDescription = description || 'nexjoob est la plateforme de recrutement #1 au Cameroun. Trouvez des milliers d\'offres d\'emploi et postulez en un clic.';
  const metaImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
