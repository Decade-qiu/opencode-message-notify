/**
 * OpenCode Plugin Types
 */

export interface UsageStats {
  cost: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface PluginConfig {
  /** Bark app token for iOS notifications */
  token?: string;
  /** Notification title template */
  title?: string;
  /** Whether to send notifications on session completion */
  notifyOnComplete?: boolean;
  /** Whether to send notifications on permission requests */
  notifyOnPermission?: boolean;
  /** Whether to include usage statistics in notifications */
  includeUsageStats?: boolean;
  /** Whether to include the actual agent message content */
  includeMessageContent?: boolean;
}

export interface StepPart {
  type: string;
  cost?: number;
  tokens?: {
    input?: number;
    output?: number;
    reasoning?: number;
    cache?: {
      read?: number;
      write?: number;
    };
  };
  messageID?: string;
  text?: string;
}

export interface EventProperties {
  part?: StepPart;
}

export interface MessagePartUpdatedEvent {
  type: "message.part.updated";
  properties?: EventProperties;
}

export interface SessionIdleEvent {
  type: "session.idle";
}

export interface PermissionAskEvent {
  type: "permission.ask";
  input?: {
    type?: string;
  };
}

export type PluginEvent = MessagePartUpdatedEvent | SessionIdleEvent | PermissionAskEvent;

export interface BarkPluginResult {
  event?: (event: PluginEvent) => Promise<void>;
  "permission.ask"?: (input: { type?: string }) => Promise<void>;
}

export interface ProjectInfo {
  id?: string;
  name?: string;
  path?: string;
}

export interface PluginContext {
  project?: ProjectInfo;
}

export type PluginFactory = (context: PluginContext) => Promise<BarkPluginResult>;
