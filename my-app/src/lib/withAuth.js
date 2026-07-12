import { auth } from "@/auth"   // ← changed
import { NextResponse } from "next/server"

export function withAuth(handler) {
  return async (req, context) => {
    const session = await auth()   // ← no arguments needed
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    return handler(req, context, session)
  }
}