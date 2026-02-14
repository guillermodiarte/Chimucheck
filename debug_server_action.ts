
import { updateEvent } from "@/app/actions/events";
import { db } from "@/lib/prisma";

async function test() {
  console.log("\n--- Testing updateEvent Action with FormData ---");
  const eventId = "26260caa-405e-4886-88f7-392b1e2760a9";

  // Verify event exists
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    console.log("Event not found!");
    const anyEvent = await db.event.findFirst();
    if (anyEvent) {
      console.log("Using event:", anyEvent.id);
      await runTest(anyEvent.id, anyEvent);
    } else {
      console.log("No events.");
    }
    return;
  }
  await runTest(eventId, event);
}

async function runTest(eventId: string, event: any) {
  console.log("Found event:", event.name);

  // Create FormData
  const formData = new FormData();
  formData.append("name", event.name);
  // Ensure we send empty string if null, matching browser behavior
  formData.append("description", event.description || "");

  // CRITICAL: Send empty string for date
  formData.append("date", "");

  formData.append("location", event.location || "");
  formData.append("imageUrl", event.imageUrl || "");
  formData.append("active", event.active ? "on" : "off");

  console.log("Calling updateEvent with date='' ...");

  try {
    // @ts-ignore
    const result = await updateEvent(eventId, null, formData);
    console.log("Result:", result);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") {
      console.log("SUCCESS! Action redirected (meaning it completed).");
    } else if (e.code === "P2002") {
      console.log("Prisma Constraint Violation:", e);
    } else {
      console.error("Action Failed with error:", e);
      console.error("Error details:", JSON.stringify(e, null, 2));
    }
  }
}

test();
