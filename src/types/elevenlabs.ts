/**
 * Type definitions for the ElevenLabs Conversational AI widget.
 *
 * The widget is loaded as a web component (<elevenlabs-convai>)
 * and interacts via shadowRoot and window globals.
 */

// ----------------------------------------------------------------
// Widget custom element
// ----------------------------------------------------------------

/** The <elevenlabs-convai> custom element with its API surface. */
export interface ElevenLabsWidgetElement extends HTMLElement {
  shadowRoot: ShadowRoot;
  /** Connect to the ElevenLabs service */
  connect?: () => void;
  /** Disconnect from the ElevenLabs service */
  disconnect?: () => void;
}

// ----------------------------------------------------------------
// Client tools exposed on window
// ----------------------------------------------------------------

export interface MobileClientTools {
  captureVisualData?: () => Promise<VisualCaptureData | null>;
  endConversation?: () => void;
  [key: string]: ((...args: unknown[]) => unknown) | undefined;
}

export interface VisualCaptureData {
  timestamp: string;
  frames?: Blob[];
  thumbnail?: string;
  duration?: number;
}

// ----------------------------------------------------------------
// Window augmentation
// ----------------------------------------------------------------

declare global {
  interface Window {
    mobileClientTools?: MobileClientTools;
  }
}
