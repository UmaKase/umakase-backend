// This is a module
export {};

declare global {
  namespace Express {
    interface Request {
      profile: AccessToken;
    }
  }
}

/**
 * Events
 * - add-member
 * - remove-member
 * - update-food - when food is not update correctly and user try to reload. send this event
 */
export type RoomEvent = "add-member" | "remove-member" | "update-food";

// try catch wrapper
declare global {
  function unwrap<T>(promise: Promise<T>): Promise<[T?, any?]>;
}
