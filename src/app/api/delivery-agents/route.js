import { DeliveryAgent } from "@/models/DeliveryAgent";
import { mongooseConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required."),
});

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const agents = await DeliveryAgent.find({ sellerId: session.user.id }).sort({ name: 1 });
    return NextResponse.json({ data: agents }, { status: 200 });
  } catch (error) {
    console.error("Fetch delivery agents error:", error);
    return NextResponse.json({ message: "Error fetching delivery agents." }, { status: 500 });
  }
});

export const POST = withAuth(async (req, _context, session) => {
  try {
    const body = await req.json();
    const parsed = agentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
    }
    await mongooseConnect();
    const agent = await DeliveryAgent.create({ ...parsed.data, sellerId: session.user.id });
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Create delivery agent error:", error);
    return NextResponse.json({ message: "Error creating delivery agent." }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, _context, session) => {
  try {
    const { _id, ...rest } = await req.json();
    if (!_id) {
      return NextResponse.json({ message: "Agent id is required." }, { status: 400 });
    }
    const parsed = agentSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
    }
    await mongooseConnect();
    const updated = await DeliveryAgent.updateOne(
      { _id, sellerId: session.user.id },
      { $set: parsed.data }
    );
    if (updated.matchedCount === 0) {
      return NextResponse.json({ message: "Agent not found or access denied." }, { status: 404 });
    }
    return NextResponse.json({ message: "Agent updated." }, { status: 200 });
  } catch (error) {
    console.error("Update delivery agent error:", error);
    return NextResponse.json({ message: "Error updating delivery agent." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, _context, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Agent id is required." }, { status: 400 });
    }
    await mongooseConnect();
    await DeliveryAgent.deleteOne({ _id: id, sellerId: session.user.id });
    return NextResponse.json({ message: "Agent deleted." }, { status: 200 });
  } catch (error) {
    console.error("Delete delivery agent error:", error);
    return NextResponse.json({ message: "Error deleting delivery agent." }, { status: 500 });
  }
});