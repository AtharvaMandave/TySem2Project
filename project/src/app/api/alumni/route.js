import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import AlumniProfile from "@/models/AlumniProfile";

export async function GET(request) {
  try {
    await connectDB();

    // Get search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const status = searchParams.get("status") || "";

    // Find all users with the "alumni" role
    let userQuery = { role: "alumni" };

    if (search) {
      userQuery.name = { $regex: search, $options: "i" };
    }

    const alumniUsers = await User.find(userQuery)
      .select("name email createdAt")
      .lean();

    const userIds = alumniUsers.map((u) => u._id);

    // Build profile query
    let profileQuery = { userId: { $in: userIds } };

    if (year) {
      profileQuery.passingYear = parseInt(year, 10);
    }
    if (status) {
      profileQuery.currentStatus = { $regex: status, $options: "i" };
    }

    // Exclude private alumni profiles
    profileQuery.privacy = { $ne: true };

    const alumniProfiles = await AlumniProfile.find(profileQuery).lean();

    // Map profiles to their user IDs for easy lookup
    const profileMap = {};
    alumniProfiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    // Combine user + profile data, only include alumni who have a public profile
    const alumni = alumniUsers
      .filter((u) => profileMap[u._id.toString()])
      .map((u) => {
        const profile = profileMap[u._id.toString()];
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          passingYear: profile.passingYear,
          currentStatus: profile.currentStatus,
          company: profile.company || "",
          college: profile.college || "",
          joinedAt: u.createdAt,
        };
      });

    // Sort by passing year descending (most recent first)
    alumni.sort((a, b) => b.passingYear - a.passingYear);

    return NextResponse.json({ alumni, total: alumni.length });
  } catch (error) {
    console.error("Error fetching alumni:", error);
    return NextResponse.json(
      { error: "Failed to fetch alumni" },
      { status: 500 }
    );
  }
}
