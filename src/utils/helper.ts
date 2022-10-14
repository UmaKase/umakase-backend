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
import { Log } from "@utils/Log";
import { RoomEvent } from "types/types";
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
const logger = new Log();

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
): string[] => {
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

const addRoomMember = async (
  roomId: string,
  newRoomies: string[]
): Promise<[boolean, string, any?]> => {
  let result = false;

  const room = await prisma.room.findFirst({
    where: { id: roomId },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    return [result, "Can't find room"];
  }
  const currentRoomMember = room.user.map((member) => {
    return member.profile.username;
  });

  const roomies = await getUserProfiles([...newRoomies, ...currentRoomMember]);

  const foods = mergeFoodByRoommateIds(roomies);

  // clear old foods on room
  // TODO: Back up ?
  const deleteFoods = prisma.foodsOnRooms
    .deleteMany({
      where: {
        roomId,
      },
    })
    .catch((e) => {
      logger.error("Adding Member to Room\n", e);
    });
  const deleteRoomies = prisma.profilesOnRooms
    .deleteMany({
      where: {
        roomId,
      },
    })
    .catch((e) => {
      logger.error("Adding Member to Room\n", e);
    });

  await Promise.all([deleteFoods, deleteRoomies]);

  const updated = await prisma.room
    .update({
      where: {
        id: roomId,
      },
      data: {
        foods: {
          create: foods.map((id) => ({
            food: {
              connect: {
                id,
              },
            },
          })),
        },
        user: {
          create: roomies.map((roomie) => ({
            profile: {
              connect: { username: roomie.username },
            },
          })),
        },
      },
    })
    .catch((e) => {
      logger.error("AddRoomMember/Updating: ", e);
    });

  return [true, "", updated];
};
const removeRoomMember = async (
  _: string,
  // roomId: string,
  __: string[]
  // removeRoomies: string[]
): Promise<[boolean, string, any?]> => {
  return [true, ""];
};
const updateRommFood = async () => {};

function isRoomEvent(event: string): event is RoomEvent {
  const roomEvents = ["add-member", "remove-member", "update-food"];
  return roomEvents.includes(event);
}

export const helper = {
  getUserProfiles,
  mergeFoodByRoommateIds,
  addRoomMember,
  removeRoomMember,
  updateRommFood,
  isRoomEvent,
};
