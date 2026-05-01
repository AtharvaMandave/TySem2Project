import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import FacultyProfile from "@/models/FacultyProfile";
import AlumniProfile from "@/models/AlumniProfile";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, profileData } = body;

    // --- Validate common fields ---
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const validRoles = ["student", "faculty", "alumni"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be student, faculty, or alumni" },
        { status: 400 }
      );
    }

    await dbConnect();

    // --- Check for duplicate email ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // --- Hash password ---
    const hashedPassword = await bcrypt.hash(password, 12);

    // --- Create user ---
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    // --- Create role-specific profile ---
    try {
      if (role === "student") {
        const { class: studentClass, division, rollNumber } = profileData || {};
        if (!studentClass || !division || !rollNumber) {
          // Rollback user creation
          await User.findByIdAndDelete(user._id);
          return NextResponse.json(
            { error: "Class, division, and roll number are required for students" },
            { status: 400 }
          );
        }
        await StudentProfile.create({
          userId: user._id,
          class: studentClass,
          division,
          rollNumber,
        });
      } else if (role === "faculty") {
        const { subject, designation } = profileData || {};
        if (!subject || !designation) {
          await User.findByIdAndDelete(user._id);
          return NextResponse.json(
            { error: "Subject and designation are required for faculty" },
            { status: 400 }
          );
        }
        await FacultyProfile.create({
          userId: user._id,
          subject,
          designation,
        });
      } else if (role === "alumni") {
        const { passingYear, currentStatus, company, college, privacy } =
          profileData || {};
        if (!passingYear || !currentStatus) {
          await User.findByIdAndDelete(user._id);
          return NextResponse.json(
            { error: "Passing year and current status are required for alumni" },
            { status: 400 }
          );
        }
        await AlumniProfile.create({
          userId: user._id,
          passingYear: Number(passingYear),
          currentStatus,
          company: company || "",
          college: college || "",
          privacy: privacy || false,
        });
      }
    } catch (profileError) {
      // Rollback user creation if profile creation fails
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
