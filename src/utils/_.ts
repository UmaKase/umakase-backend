import { PrismaClient, Profile, User } from "@prisma/client";
import bcrypt from "bcrypt";
import HttpStatusCode from "@utils/httpStatus";
import { logg } from "../server";

const prisma = new PrismaClient();

type UserWithProfile =
    | (User & {
          profile: Profile | null;
      })
    | null;

// Random integer number generator
const randomInt = (min: number, max: number, excludes?: number[]) => {
    if (min > max || (excludes?.length || 0) > max) {
        logg.error("Random function error: ", { min, max, excludes });
        return randomInt(min, max, []);
    }
    const random = Math.floor(Math.random() * (max - min)) + min;
    if (excludes) {
        if (excludes.includes(random)) {
            return randomInt(min, max, excludes);
        } else {
            return random;
        }
    }
    return random;
};

/**
 * Return {times} of random number from min to max
 */
const randomMultiple = (min: number, max: number, times: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < times; i++) {
        result.push(randomInt(min, max));
    }
    return result;
};

/**
 * ユーザー認証
 * @param username
 * @param password
 * @returns [isValidUser, HTTPStatusCode, MessageOrError]
 */
const checkLogin = async (username: string, password: string): Promise<[UserWithProfile | undefined, HttpStatusCode, string]> => {
    //ANCHOR Check If User Existed
    // TODO user more than only username
    const user: UserWithProfile = await prisma.user.findFirst({
        where: {
            profile: { username },
        },
        include: {
            profile: true,
        },
    });

    if (!user || !user.profile) {
        return [undefined, HttpStatusCode.BAD_REQUEST, "User not found or Profile problem"];
    }

    // ANCHOR 2 filter : Password validation
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return [undefined, HttpStatusCode.BAD_REQUEST, "Username or password not correct"];
    }

    return [user, HttpStatusCode.OK, "Success"];
};

const attachGlobalFunction = () => {
    globalThis.unwrap = async (promise, fallback: any = undefined) => {
        try {
            const result = await promise;
            return [result, undefined];
        } catch (error: any) {
            logg.error(error);
            if (typeof fallback === "function") {
                return [fallback(), error];
            }
            return [fallback, error];
        }
    };
};

export { randomInt, randomMultiple, checkLogin, attachGlobalFunction };
