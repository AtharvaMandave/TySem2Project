import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import User from "@/models/User";

// GET /api/conversations/[id]/messages — fetch messages for a conversation
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    // Verify user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === session.user.id
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the other participant's details
    const otherParticipantId = conversation.participants
      .map((p) => p.toString())
      .find((pid) => pid !== session.user.id);

    const otherUserDoc = await User.findById(otherParticipantId)
      .select("name email role")
      .lean();

    const otherUser = otherUserDoc
      ? {
          id: otherUserDoc._id.toString(),
          name: otherUserDoc.name,
          email: otherUserDoc.email,
          role: otherUserDoc.role,
        }
      : { id: otherParticipantId, name: "Unknown User", email: "", role: "unknown" };

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    const result = messages.map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      text: msg.text,
      createdAt: msg.createdAt,
      readBy: (msg.readBy || []).map((r) => r.toString()),
    }));

    return NextResponse.json({ messages: result, otherUser });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages — send a new message
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    if (text.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is a participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === session.user.id
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create message
    const message = await Message.create({
      conversationId: id,
      senderId: session.user.id,
      text: text.trim(),
      readBy: [session.user.id],
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(id, {
      lastMessage: text.trim().slice(0, 100),
      lastMessageAt: new Date(),
    });

    return NextResponse.json(
      {
        message: {
          id: message._id.toString(),
          senderId: message.senderId.toString(),
          text: message.text,
          createdAt: message.createdAt,
          readBy: message.readBy.map((r) => r.toString()),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
