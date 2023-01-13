/**
 *****************************************************||
 *----- Contain Room Helper Function --------------**
 *****************************************************||
 */

import { Food, FoodsOnRooms, PrismaClient, Profile, Room } from "@prisma/client";
import { Log } from "@utils/Log";
import { RoomEvent } from "types/types";

type ProfileWithCreatedRoomAndFoodOnRoom = Profile & {
  createdRooms: (Room & {
    foods: (FoodsOnRooms & {
      food: Food;
    })[];
  })[];
};

const prisma = new PrismaClient({
  log: [],
});
const logger = new Log();

const createDefaultRoom = async (username: string, foodIds: string[] = []) => {
  const userProfile = await roomHelper.getUserProfiles([username]);
  return prisma.room.create({
    data: {
      name: "__default",
      creator: {
        connect: {
          id: userProfile[0].id,
        },
      },
      foods: {
        create: foodIds.map((id) => ({
          food: {
            connect: {
              id,
            },
          },
        })),
      },
      user: {
        create: {
          profileId: userProfile[0].id,
        },
      },
    },
    include: {
      foods: {
        select: {
          foodId: false,
          roomId: false,
          food: true,
        },
      },
      user: {
        select: {
          profileId: false,
          roomId: false,
          profile: true,
        },
      },
    },
  });
};

/**
 * ANCHOR Get Profiles with usernames
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
        createdRooms: {
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
    logger.error("Fetch Profile Error in function getUserProfles");
    return [];
  }
  return profiles;
};

/**
 * SECTION Get Food Mergered by User's Foods
 * TODO: Fix it to make it faster
 * @return Food Ids
 */
const mergeFoodByRoommateIds = (
  roomies: ProfileWithCreatedRoomAndFoodOnRoom[]
): string[] => {
  const innerJoinFoodIds: string[] = [];
  let foodOnAllRoom: string[] = roomies.flatMap((roomate) =>
    roomate.createdRooms[0].foods.map((f) => f.food.id)
  );
  // Count times of 1 food inside the whole array.
  let index = 0;
  while (index < foodOnAllRoom.length) {
    const thisFoodInArray = foodOnAllRoom.filter((food) => food === foodOnAllRoom[index]);

    if (thisFoodInArray.length === roomies.length) {
      innerJoinFoodIds.push(foodOnAllRoom[index]);
      // change current index food to random string so that it won't be duplicated
      // TODO Find better way
      foodOnAllRoom[index] = "_";
    }

    // FIXME Clear this food in all food in room array
    // foodOnAllRoom = foodOnAllRoom.filter(
    //   (food) => food !== foodOnAllRoom[index]
    // );

    index++;
  }

  return innerJoinFoodIds;
};
// !SECTION

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

export const roomHelper = {
  getUserProfiles,
  mergeFoodByRoommateIds,
  addRoomMember,
  removeRoomMember,
  updateRommFood,
  isRoomEvent,
  createDefaultRoom,
};
