
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

// Substack API Payload Interface
export interface SubstackNotePayload {
  bodyJson: ProseMirrorDoc;
  tabId: string;
  surface: string;
  replyMinimumRole: string;
  scheduled_at?: string; // Optional field for scheduling
  draft?: boolean;
}

export enum RequestStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Message Passing Interfaces
export interface PublishNoteMessage {
  type: 'PUBLISH_NOTE';
  payload: SubstackNotePayload;
}

export interface PublishNoteResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  status?: number;
}
