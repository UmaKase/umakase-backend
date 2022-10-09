// This is a module
export {};

declare global {
  namespace Express {
    interface Request {
      profile: AccessToken;
    }
  }
}

export type RoomEvent = "add-member" | "remove-member" | "update-food";
