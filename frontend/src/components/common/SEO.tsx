import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO = ({
    title = "SÉRRA FASHION - Luxury Fashion & Apparel",
    description = "Discover the latest in luxury fashion with SÉRRA FASHION. Shop our curated collection of premium apparel, accessories, and more.",
    keywords = "fashion, luxury, apparel, clothing, sērra fashion, online shopping",
    image = "/og-image.jpg", // Make sure to add this to public folder later
    url = window.location.href,
    type = "website"
}: SEOProps) => {
    const siteName = "SÉRRA FASHION";
    const fullTitle = title === siteName ? title : `${title} | ${siteName}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEO;
