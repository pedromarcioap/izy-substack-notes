export const SUBSTACK_LOGIN_URL = 'https://substack.com/sign-in';

export const DEFAULT_PAYLOAD_CONFIG = {
  tabId: 'for-you',
  surface: 'feed',
  replyMinimumRole: 'everyone',
};

// Helper to generate dynamic URL based on subdomain
export function getApiUrl(subdomain, type) {
  // NOTES são sempre globais no substack.com
  if (type === 'note') {
    return 'https://substack.com/api/v1/notes';
  }
  
  // POSTS são específicos da publicação (subdomínio)
  const domain = subdomain ? `${subdomain}.substack.com` : 'substack.com';
  return `https://${domain}/api/v1/posts`;
}