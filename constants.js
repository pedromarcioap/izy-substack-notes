export const SUBSTACK_LOGIN_URL = 'https://substack.com/sign-in';

export const DEFAULT_PAYLOAD_CONFIG = {
  tabId: 'for-you',
  surface: 'feed',
  replyMinimumRole: 'everyone',
};

// Helper to generate dynamic URL based on subdomain
export function getApiUrl(subdomain, type) {
  const domain = subdomain ? `${subdomain}.substack.com` : 'substack.com';
  const endpoint = type === 'note' ? 'notes' : 'posts';
  return `https://${domain}/api/v1/${endpoint}`;
}