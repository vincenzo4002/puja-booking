import mongoose from "mongoose";
import Booking from "../models/Booking.js";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/puja_dashboard";

// Small deterministic PRNG so seeded data is the same on every run.
let seed = 20261123;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const PUJAS = [
  ["Satyanarayan Puja", 2100],
  ["Rudrabhishek", 3100],
  ["Ganesh Puja", 1500],
  ["Lakshmi Puja", 2500],
  ["Navagraha Shanti", 4100],
  ["Griha Pravesh", 5100],
  ["Maha Mrityunjaya Jaap", 11000],
  ["Durga Saptashati Path", 3500],
  ["Kaal Sarp Dosh Nivaran", 6100],
  ["Hanuman Chalisa Path", 1100],
];
const FIRST = ["Aarav", "Vivaan", "Aditya", "Rohan", "Karan", "Priya", "Anjali", "Sneha", "Neha", "Pooja", "Rahul", "Amit", "Sunita", "Meera", "Vikram", "Kavita", "Manish", "Rekha", "Deepak", "Shalini"];
const LAST = ["Sharma", "Verma", "Gupta", "Mishra", "Tiwari", "Singh", "Pandey", "Agarwal", "Yadav", "Srivastava", "Dubey", "Joshi"];
const GOTRA = ["Kashyap", "Bharadwaj", "Vashistha", "Gautam", "Atri", "Kaushik", "Vatsa"];
const PANDITS = ["Pt. Ramesh Shastri", "Pt. Harish Dwivedi", "Pt. Mohan Tripathi", "Pt. Suresh Upadhyay"];
const PLACES = {
  "At Temple": ["Kashi Vishwanath Temple, Varanasi", "Anandeshwar Temple, Kanpur", "Parmat Temple, Kanpur"],
  "At Home": ["Civil Lines, Kanpur", "Swaroop Nagar, Kanpur", "Kidwai Nagar, Kanpur", "Gomti Nagar, Lucknow"],
  Online: ["Video call (link shared on WhatsApp)"],
};
const NOTES = ["", "", "Please arrange puja samagri.", "Family of 6 will attend.", "Prefers morning muhurat.", "Needs prasad delivery after the puja."];

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function statusFor(offsetDays) {
  if (offsetDays < -3) return rand() < 0.93 ? "Completed" : "Confirmed";
  if (offsetDays <= 1) return rand() < 0.6 ? "In Progress" : "Confirmed";
  if (offsetDays <= 7) return rand() < 0.7 ? "Confirmed" : "Pending";
  return rand() < 0.8 ? "Pending" : "Confirmed";
}

function historyFor(status, createdAt, pujaDate) {
  const order = ["Pending", "Confirmed", "In Progress", "Completed"];
  const upto = order.indexOf(status);
  const start = createdAt.getTime();
  const end = Math.min(now, pujaDate.getTime());
  // Spread the transitions evenly between creation and now (or the puja date).
  return order.slice(0, upto + 1).map((s, i) => ({
    status: s,
    at: new Date(start + ((end - start) * i) / Math.max(upto, 1)),
  }));
}

const bookings = Array.from({ length: 42 }, (_, i) => {
  const [puja, base] = pick(PUJAS);
  const first = pick(FIRST);
  const last = pick(LAST);
  const mode = pick(["At Temple", "At Home", "Online"]);
  const offsetDays = Math.floor(rand() * 60) - 30;
  const pujaDate = new Date(now + offsetDays * DAY);
  pujaDate.setHours(6 + Math.floor(rand() * 8), rand() < 0.5 ? 0 : 30, 0, 0);
  // A booking can't have been created in the future.
  const createdAt = new Date(
    Math.min(pujaDate.getTime() - (3 + Math.floor(rand() * 20)) * DAY, now - DAY)
  );
  const status = statusFor(offsetDays);
  const extra = mode === "At Home" ? 500 : 0;

  return {
    bookingId: `PB-${1001 + i}`,
    devotee: {
      name: `${first} ${last}`,
      phone: `9${Math.floor(100000000 + rand() * 899999999)}`,
      email: `${first}.${last}${Math.floor(rand() * 90 + 10)}@example.com`.toLowerCase(),
      gotra: pick(GOTRA),
    },
    puja,
    pujaDate,
    amount: base + extra,
    status,
    mode,
    location: pick(PLACES[mode]),
    pandit: pick(PANDITS),
    notes: pick(NOTES),
    statusHistory: historyFor(status, createdAt, pujaDate),
    createdAt,
    updatedAt: new Date(Math.min(now, pujaDate.getTime())),
  };
});

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await Booking.deleteMany({});
  await Booking.insertMany(bookings, { timestamps: false });
  console.log(`Seeded ${bookings.length} bookings into ${mongoose.connection.name}`);
} catch (err) {
  console.error("Seeding failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
