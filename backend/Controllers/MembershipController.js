import mongoose from "mongoose";
import Membership from "../Models/Membership.js";

export const getMyJoinedClubs = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const clubs = await Membership.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "clubs",
          localField: "clubId",
          foreignField: "_id",
          as: "club",
        },
      },
      {
        $unwind: "$club",
      },
      {
        $project: {
          _id: 0,
          name: "$club.name",
        },
      },
    ]);

    // return only array of names
    const clubNames = clubs.map((c) => c.name);
    res.json(clubNames);
  } catch (err) {
    console.error("getMyJoinedClubs error:", err);
    res.status(500).json({ message: "Failed to fetch joined clubs" });
  }
};
