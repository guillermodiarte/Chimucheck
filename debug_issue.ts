
import { z } from "zod";
import { db } from "@/lib/prisma";

const dateSchema = z.preprocess(
  (arg) => (arg === "" || arg === undefined ? null : arg),
  z.coerce.date().nullable().optional()
);

async function test() {
  console.log("--- Testing Zod Schema ---");
  const resultEmpty = dateSchema.safeParse("");
  console.log("Parse '':", resultEmpty);

  const resultNull = dateSchema.safeParse(null);
  console.log("Parse null:", resultNull);

  const resultUndefined = dateSchema.safeParse(undefined);
  console.log("Parse undefined:", resultUndefined);

  const resultDate = dateSchema.safeParse("2024-01-01");
  console.log("Parse date:", resultDate);

  console.log("\n--- Testing Prisma Update ---");
  const eventId = "26260caa-405e-4886-88f7-392b1e2760a9"; // ID from screenshot

  try {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      console.log("Event not found with ID:", eventId);
      // Try to find ANY event to test
      const firstEvent = await db.event.findFirst();
      if (firstEvent) {
        console.log("Testing with first event found:", firstEvent.id);
        await updateEvent(firstEvent.id);
      } else {
        console.log("No events found in DB.");
      }
    } else {
      await updateEvent(eventId);
    }

  } catch (e) {
    console.error("Unexpected error in test script:", e);
  }
}

async function updateEvent(id: string) {
  try {
    console.log(`Attempting to set date to NULL for event ${id}...`);
    const updated = await db.event.update({
      where: { id },
      data: {
        date: null
      }
    });
    console.log("Success! Event updated. New date:", updated.date);
  } catch (e) {
    console.error("Prisma Update Failed:", e);
  }
}

test();
