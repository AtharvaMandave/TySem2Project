import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import FacultyProfile from "@/models/FacultyProfile";
import AlumniProfile from "@/models/AlumniProfile";

// GET /api/profile — fetch current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ userId: user._id }).lean();
    } else if (user.role === "faculty") {
      profile = await FacultyProfile.findOne({ userId: user._id }).lean();
    } else if (user.role === "alumni") {
      profile = await AlumniProfile.findOne({ userId: user._id }).lean();
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: profile
        ? {
            ...profile,
            _id: profile._id.toString(),
            userId: profile.userId.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile — update current user's profile
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, profileData } = body;

    await connectDB();

    // Update user name if provided
    if (name && name.trim()) {
      await User.findByIdAndUpdate(session.user.id, {
        name: name.trim(),
      });
    }

    // Update role-specific profile
    const user = await User.findById(session.user.id).select("role").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profileData) {
      if (user.role === "student") {
        await StudentProfile.findOneAndUpdate(
          { userId: session.user.id },
          {
            $set: {
              class: profileData.class,
              division: profileData.division,
              rollNumber: profileData.rollNumber,
            },
          },
          { upsert: true, new: true }
        );
      } else if (user.role === "faculty") {
        await FacultyProfile.findOneAndUpdate(
          { userId: session.user.id },
          {
            $set: {
              subject: profileData.subject,
              designation: profileData.designation,
            },
          },
          { upsert: true, new: true }
        );
      } else if (user.role === "alumni") {
        await AlumniProfile.findOneAndUpdate(
          { userId: session.user.id },
          {
            $set: {
              passingYear: profileData.passingYear,
              currentStatus: profileData.currentStatus,
              company: profileData.company,
              college: profileData.college,
              privacy: profileData.privacy,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
