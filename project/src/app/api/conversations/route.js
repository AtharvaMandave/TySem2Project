import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import User from "@/models/User";

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Get participant details
    const allParticipantIds = [
      ...new Set(
        conversations.flatMap((c) => c.participants.map((p) => p.toString()))
      ),
    ];

    const users = await User.find({ _id: { $in: allParticipantIds } })
      .select("name email role")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const result = conversations.map((conv) => {
      const otherParticipantId = conv.participants
        .map((p) => p.toString())
        .find((id) => id !== session.user.id);

      const otherUser = userMap[otherParticipantId] || {
        name: "Unknown",
        role: "unknown",
      };

      return {
        id: conv._id.toString(),
        otherUser: {
          id: otherParticipantId,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
        },
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations — create or find existing conversation
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alumniId } = await request.json();

    if (!alumniId) {
      return NextResponse.json(
        { error: "Alumni ID is required" },
        { status: 400 }
      );
    }

    if (alumniId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if the alumni user exists
    const alumniUser = await User.findById(alumniId).select("name role");
    if (!alumniUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [session.user.id, alumniId] },
    });

    if (conversation) {
      return NextResponse.json({
        conversationId: conversation._id.toString(),
        isNew: false,
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [session.user.id, alumniId],
      lastMessage: "",
      lastMessageAt: new Date(),
    });

    return NextResponse.json(
      {
        conversationId: conversation._id.toString(),
        isNew: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
