import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, getSeoMeta } from '../seo';

function setMetaContent(selector: string, content: string) {
  const node = document.querySelector<HTMLMetaElement>(selector);
  if (node) {
    node.setAttribute('content', content);
  }
}

function setCanonicalHref(href: string) {
  const node = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (node) {
    node.setAttribute('href', href);
  }
}

export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoMeta(location.pathname);
    const canonical = getCanonicalUrl(location.pathname);

    document.title = seo.title;
    setMetaContent('meta[name="title"]', seo.title);
    setMetaContent('meta[name="description"]', seo.description);
    setMetaContent('meta[property="og:title"]', seo.title);
    setMetaContent('meta[property="og:description"]', seo.description);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[property="twitter:title"]', seo.title);
    setMetaContent('meta[property="twitter:description"]', seo.description);
    setMetaContent('meta[property="twitter:url"]', canonical);
    setCanonicalHref(canonical);
  }, [location.pathname]);

  return null;
}
