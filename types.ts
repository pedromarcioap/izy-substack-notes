
// ProseMirror Structure Interfaces
export interface ProseMirrorText {
  type: 'text';
  text: string;
}

export interface ProseMirrorParagraph {
  type: 'paragraph';
  content: ProseMirrorText[];
}

export interface ProseMirrorDoc {
  type: 'doc';
  attrs: {
    schemaVersion: string;
  };
  content: ProseMirrorParagraph[];
}

// Substack API Payload Interface (NOTES)
export interface SubstackNotePayload {
  bodyJson: ProseMirrorDoc;
  tabId: string;
  surface: string;
  replyMinimumRole: string;
  scheduled_at?: string; // Optional field for scheduling
  draft?: boolean;
}

// Substack API Payload Interface (POSTS / DRAFTS)
export interface SubstackPostPayload {
  title: string;
  body_json: ProseMirrorDoc; // Note: API often uses snake_case for posts
  draft: boolean;
  audience: string;
}

export enum RequestStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Message Passing Interfaces
export type ExtensionMessage = 
  | { type: 'PUBLISH_NOTE'; payload: SubstackNotePayload }
  | { type: 'PUBLISH_POST'; payload: SubstackPostPayload };

export interface PublishResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  status?: number;
}
