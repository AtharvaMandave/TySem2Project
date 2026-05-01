import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";
import Rsvp from "@/models/Rsvp";

// GET /api/invitations — get events the current user is invited to
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const role = session.user.role;

    // Build query based on role
    let query = {};
    if (role === "student") {
      query.inviteTarget = { $in: ["students", "all"] };
    } else if (role === "alumni") {
      query.inviteTarget = { $in: ["alumni", "all"] };
    } else if (role === "faculty") {
      // Faculty see events they created
      query.createdBy = session.user.id;
    }

    const events = await Event.find(query).sort({ date: -1 }).lean();

    // Get creator details
    const creatorIds = [...new Set(events.map((e) => e.createdBy.toString()))];
    const creators = await User.find({ _id: { $in: creatorIds } })
      .select("name role")
      .lean();
    const creatorMap = {};
    creators.forEach((c) => {
      creatorMap[c._id.toString()] = c;
    });

    // Get RSVP status for each event
    const eventIds = events.map((e) => e._id);
    const rsvps = await Rsvp.find({
      eventId: { $in: eventIds },
      userId: session.user.id,
    }).lean();
    const rsvpMap = {};
    rsvps.forEach((r) => {
      rsvpMap[r.eventId.toString()] = r.status;
    });

    // Get RSVP counts per event
    const rsvpCounts = await Rsvp.aggregate([
      { $match: { eventId: { $in: eventIds }, status: "accepted" } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    rsvpCounts.forEach((r) => {
      countMap[r._id.toString()] = r.count;
    });

    const now = new Date();
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
        createdBy: { name: creator.name, role: creator.role },
        rsvpStatus: rsvpMap[event._id.toString()] || null,
        attendeeCount: countMap[event._id.toString()] || 0,
        isUpcoming: new Date(event.date) >= now,
      };
    });

    return NextResponse.json({ invitations: result });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST /api/invitations — RSVP to an event
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, status } = await request.json();

    if (!eventId || !["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Event ID and valid status (accepted/declined) are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Upsert RSVP
    await Rsvp.findOneAndUpdate(
      { eventId, userId: session.user.id },
      { status },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: `RSVP ${status} successfully` });
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}
