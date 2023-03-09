// This is a module
export {};

export type RouteHandler = Array<RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>>;

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
  /**
   * Try Catch Wrapper
   * @param promise Promise or async function
   * @param fallback fallback value/function if error.
   * @returns [awaited promise, error]
   * @example
   * ```ts
   *
   * // without fallback
   * const [result, error] = await unwrap(someAsyncFunction());
   * if (error) {
   *  // handle error
   * }
   * result; // result is type of T
   *
   * // with fallback
   * const [result, error] = await unwrap(someAsyncFunction(), [] as User[]);
   * result; // result's type is User[]. value is [] if error
   * // or
   * const [result, error] = await unwrap<User[], User[]>(someAsyncFunction(), []);
   * result; // result's type is User[]. value is [] if error
   * ```
   */
  function unwrap<T, T2 = undefined>(promise: Promise<T>, fallback?: T2): Promise<[T, any?] | [T2, Error]>;
}
