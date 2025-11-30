export const SUBSTACK_API_URL = 'https://substack.com/api/v1/notes';
export const SUBSTACK_LOGIN_URL = 'https://substack.com/sign-in';

export const COLORS = {
  substackOrange: '#FF6719',
  substackOrangeHover: '#E5560D',
};

// Default payload structure required by Substack Notes
export const DEFAULT_PAYLOAD_CONFIG = {
  tabId: 'for-you',
  surface: 'feed',
  replyMinimumRole: 'everyone',
};