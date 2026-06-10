import { NextRequest } from "next/server";
import { POST as refreshHandler } from "../refresh-token/route";

export async function POST(req: NextRequest) {
  return refreshHandler(req);
}
