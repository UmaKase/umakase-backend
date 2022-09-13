/**
 *****************************************************||
 *----- Contain Various Helper Function --------------**
 *****************************************************|| 
*/

import { PrismaClient, Profile, Room } from "@prisma/client";
import { logg } from "../server";

const prisma = new PrismaClient();

/**
* Get Profiles with usernames
* @return User's Profiles
*/
const getUserProfiles = async (username: string[]) => {
  let profiles: (Profile & {
    createdRoom: Room[];
  })[] = [];
  try {
    profiles = await prisma.profile.findMany({
      where: {
        username: {
          in: username
        }
      },
      include: {
        createdRoom: {
          take: 1,
          orderBy: {
            createdAt: "asc"
          },
        }
      }
    });
  } catch (_) {
    logg.error("Fetch Profile Error in function getUserProfles")
    return [];
  }
  return profiles;
}

/**
* Get Food Mergered by User's Foods
* @return {string[]} Food Ids
*/
const mergeFoodByRoommateIds = async (roomies: (Profile & { createdRoom: Room[] })[]) => {

  console.dir(roomies, {
    depth: null
  })

  return [];
}

export const helper = {
  getUserProfiles,
  mergeFoodByRoommateIds
}