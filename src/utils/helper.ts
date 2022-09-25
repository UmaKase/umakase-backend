/**
 *****************************************************||
 *----- Contain Various Helper Function --------------**
 *****************************************************||
 */

import {
  Food,
  FoodsOnRooms,
  PrismaClient,
  Profile,
  Room,
} from "@prisma/client";
import { logg } from "../server";

type ProfileWithCreatedRoomAndFoodOnRoom = Profile & {
  createdRoom: (Room & {
    foods: (FoodsOnRooms & {
      food: Food;
    })[];
  })[];
};

const prisma = new PrismaClient({
  log: [],
});

/**
 * Get Profiles with usernames
 * @return User's Profiles
 */
const getUserProfiles = async (username: string[]) => {
  let profiles: ProfileWithCreatedRoomAndFoodOnRoom[] = [];

  try {
    profiles = await prisma.profile.findMany({
      where: {
        username: {
          in: username,
        },
      },
      include: {
        createdRoom: {
          take: 1,
          orderBy: {
            createdAt: "asc",
          },
          include: {
            foods: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });
  } catch (_) {
    logg.error("Fetch Profile Error in function getUserProfles");
    return [];
  }
  return profiles;
};

/**
 * Get Food Mergered by User's Foods
 * TODO: Fix it to make it faster
 * @return Food Ids
 */
const mergeFoodByRoommateIds = (
  roomies: ProfileWithCreatedRoomAndFoodOnRoom[]
) => {
  const innerJoinFoodIds: string[] = [];
  let foodOnAllRoom: string[] = roomies.flatMap((roomate) =>
    roomate.createdRoom[0].foods.map((f) => f.food.id)
  );
  // Count times of 1 food inside the whole array.
  let index = 0;
  while (index < foodOnAllRoom.length) {
    const thisFoodInArray = foodOnAllRoom.filter(
      (food) => food === foodOnAllRoom[index]
    );
    if (thisFoodInArray.length === roomies.length) {
      innerJoinFoodIds.push(foodOnAllRoom[index]);
    }

    // Clear this food in all food in room array
    foodOnAllRoom = foodOnAllRoom.filter(
      (food) => food !== foodOnAllRoom[index]
    );

    index++;
  }

  return innerJoinFoodIds;
};

export const helper = {
  getUserProfiles,
  mergeFoodByRoommateIds,
};
