import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";

// GET /api/events — list events visible to the current user
export async function GET() {
  try {
    const session = await auth();
    await connectDB();

    let query = {};

    // Filter events based on user role
    if (session?.user?.role === "student") {
      query.inviteTarget = { $in: ["students", "all"] };
    } else if (session?.user?.role === "alumni") {
      query.inviteTarget = { $in: ["alumni", "all"] };
    }
    // Faculty and unauthenticated users see all events

    const events = await Event.find(query)
      .sort({ date: -1 })
      .lean();

    // Get creator details
    const creatorIds = [...new Set(events.map((e) => e.createdBy.toString()))];
    const creators = await User.find({ _id: { $in: creatorIds } })
      .select("name role")
      .lean();

    const creatorMap = {};
    creators.forEach((c) => {
      creatorMap[c._id.toString()] = c;
    });

    const result = events.map((event) => {
      const creator = creatorMap[event.createdBy.toString()] || { name: "Unknown" };
      return {
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        inviteTarget: event.inviteTarget,
        category: event.category,
        createdBy: {
          name: creator.name,
          role: creator.role,
        },
        createdAt: event.createdAt,
      };
    });

    return NextResponse.json({ events: result });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events — create a new event (faculty only)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "faculty") {
      return NextResponse.json(
        { error: "Only faculty members can create events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date, time, venue, inviteTarget, category } = body;

    if (!title || !description || !date || !time || !venue || !inviteTarget) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      time: time.trim(),
      venue: venue.trim(),
      inviteTarget,
      category: category?.trim() || "General",
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId: event._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
