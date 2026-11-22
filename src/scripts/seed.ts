import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { env } from "../config/env";
import { EQUIPMENT_CATEGORIES } from "../constants/categories";
import { Equipment } from "../models/Equipment";
import { Review } from "../models/Review";
import { User } from "../models/User";

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  maxmem: 128 * 16384 * 16 * 2,
} as const;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const key = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password.normalize("NFKC"),
      salt,
      64,
      SCRYPT_CONFIG,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });

  return `${salt}:${key.toString("hex")}`;
}

const seedEquipment = [
  {
    name: "CAT 320 Hydraulic Excavator",
    description:
      "Heavy-duty excavator for trenching, site preparation, and foundation work. Recent service and full inspection included.",
    category: EQUIPMENT_CATEGORIES[0],
    location: "Dhaka, Bangladesh",
    price: 420,
    rentalType: "daily" as const,
    quantity: 4,
    condition: "Excellent",
    brand: "Caterpillar",
    model: "320 GC",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
    terms: "Operator not included. Minimum 3 days. Fuel and transport charges apply.",
  },
  {
    name: "Sony FX6 Cinema Camera Kit",
    description:
      "Full-frame cinema camera with prime lenses, gimbal, monitors, and case. Ideal for interviews and commercial shoots.",
    category: EQUIPMENT_CATEGORIES[1],
    location: "Chattogram, Bangladesh",
    price: 180,
    rentalType: "daily" as const,
    quantity: 6,
    condition: "Like New",
    brand: "Sony",
    model: "FX6 + FE 24-70mm",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    terms: "Refundable deposit required. Cleaning fee applies for smoke or sand use.",
  },
  {
    name: "Toyota HiAce Commuter Van",
    description:
      "Reliable 12-seat van for airport transfers, crew transport, and local events. GPS and two charging ports included.",
    category: EQUIPMENT_CATEGORIES[2],
    location: "Dhaka, Bangladesh",
    price: 95,
    rentalType: "daily" as const,
    quantity: 8,
    condition: "Good",
    brand: "Toyota",
    model: "HiAce H300",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    terms: "Valid driving licence required. 200 km/day included; extra distance is metered.",
  },
  {
    name: "John Deere 5050D Tractor",
    description:
      "50 HP tractor with rotary tiller and trailer. Suitable for land preparation and farm transport.",
    category: EQUIPMENT_CATEGORIES[3],
    location: "Khulna, Bangladesh",
    price: 130,
    rentalType: "daily" as const,
    quantity: 3,
    condition: "Good",
    brand: "John Deere",
    model: "5050D",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    terms: "Operator available on request. Fuel not included. Minimum 2 days.",
  },
  {
    name: "MacBook Pro 16 Studio",
    description:
      "M4 Pro MacBook with 48GB RAM and 1TB SSD for editing, development, and design work.",
    category: EQUIPMENT_CATEGORIES[4],
    location: "Sylhet, Bangladesh",
    price: 55,
    rentalType: "weekly" as const,
    quantity: 5,
    condition: "Excellent",
    brand: "Apple",
    model: "MacBook Pro 16 M4 Pro",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    terms: "Software must be licensed by renter. Data wipe certificate provided after return.",
  },
  {
    name: "LED Wall & Stage Lighting Package",
    description:
      "Modular P3.9 LED wall, moving heads, controllers, and rigging for conferences and live events.",
    category: EQUIPMENT_CATEGORIES[5],
    location: "Dhaka, Bangladesh",
    price: 750,
    rentalType: "daily" as const,
    quantity: 2,
    condition: "Excellent",
    brand: "Absen",
    model: "PL3.9 + Clay Paky",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
    terms: "Technician required for operation. Venue power and load-in access must be confirmed.",
  },
  {
    name: "Boom Lift 18m Articulated",
    description:
      "Self-propelled boom lift for maintenance, signage, and elevated installation work.",
    category: EQUIPMENT_CATEGORIES[0],
    location: "Rajshahi, Bangladesh",
    price: 310,
    rentalType: "daily" as const,
    quantity: 3,
    condition: "Good",
    brand: "JLG",
    model: "600S",
    image:
      "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1200&q=80",
    terms: "Certified operator mandatory. Ground condition report required before delivery.",
  },
  {
    name: "DJI Ronin 4D Pro Kit",
    description:
      "Cinema-grade gimbal camera system with wireless focus and monitoring for mobile productions.",
    category: EQUIPMENT_CATEGORIES[1],
    location: "Dhaka, Bangladesh",
    price: 220,
    rentalType: "daily" as const,
    quantity: 4,
    condition: "Like New",
    brand: "DJI",
    model: "Ronin 4D-8K",
    image:
      "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=1200&q=80",
    terms: "Deposit required. Batteries must be returned with original chargers.",
  },
  {
    name: "Isuzu NPR Cargo Truck",
    description:
      "6-wheel cargo truck for equipment transport, event logistics, and small moves.",
    category: EQUIPMENT_CATEGORIES[2],
    location: "Barishal, Bangladesh",
    price: 160,
    rentalType: "weekly" as const,
    quantity: 5,
    condition: "Good",
    brand: "Isuzu",
    model: "NPR 71",
    image:
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80",
    terms: "Driver included. Fuel and tolls are billed separately.",
  },
  {
    name: "Canon EOS R5 Photo Package",
    description:
      "Mirrorless camera body with 24-105mm and 70-200mm lenses, flashes, and memory cards.",
    category: EQUIPMENT_CATEGORIES[1],
    location: "Cumilla, Bangladesh",
    price: 90,
    rentalType: "daily" as const,
    quantity: 7,
    condition: "Excellent",
    brand: "Canon",
    model: "EOS R5",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    terms: "Lens hoods and caps must be returned. Missing accessories are charged at retail cost.",
  },
  {
    name: "DJI Mavic 3 Pro Drone Kit",
    description:
      "Aerial camera drone with 4/3 CMOS sensor, three lenses, spare batteries, and a hard case for shoots and site surveys.",
    category: EQUIPMENT_CATEGORIES[1],
    location: "Dhaka, Bangladesh",
    price: 120,
    rentalType: "daily" as const,
    quantity: 4,
    condition: "Like New",
    brand: "DJI",
    model: "Mavic 3 Pro Cine",
    image:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
    terms: "Valid drone permit required. Batteries returned charged; deposits released after inspection.",
  },
  {
    name: "Range Rover Sport SUV",
    description:
      "Premium 5-seat SUV for executive transfers, film crews, and outstation trips with GPS and charging ports.",
    category: EQUIPMENT_CATEGORIES[2],
    location: "Chattogram, Bangladesh",
    price: 210,
    rentalType: "daily" as const,
    quantity: 3,
    condition: "Excellent",
    brand: "Land Rover",
    model: "Range Rover Sport L461",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    terms: "Chauffeur optional. 250 km/day included; fuel, tolls, and extras billed separately.",
  },
  {
    name: "Portable PA & Stage Sound Package",
    description:
      "Powered speakers, subwoofers, digital mixer, and wireless microphones for conferences, weddings, and small gigs.",
    category: EQUIPMENT_CATEGORIES[5],
    location: "Dhaka, Bangladesh",
    price: 180,
    rentalType: "daily" as const,
    quantity: 4,
    condition: "Excellent",
    brand: "JBL",
    model: "PRX812W + SRX818S",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    terms: "Sound technician recommended. Venue power and setup time must be confirmed in advance.",
  },
  {
    name: "Dell Precision 5680 Workstation",
    description:
      "Mobile workstation with 32GB RAM, 1TB SSD, and a calibrated OLED display for editing, CAD, and development.",
    category: EQUIPMENT_CATEGORIES[4],
    location: "Sylhet, Bangladesh",
    price: 95,
    rentalType: "weekly" as const,
    quantity: 6,
    condition: "Like New",
    brand: "Dell",
    model: "Precision 5680",
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    terms: "Software must be licensed by the renter. Data wipe certificate provided after return.",
  },
  {
    name: "Fujifilm X-T5 Mirrorless Kit",
    description:
      "40MP APS-C mirrorless body with 18-55mm lens, two batteries, and a weather-sealed bag for stills and video.",
    category: EQUIPMENT_CATEGORIES[1],
    location: "Khulna, Bangladesh",
    price: 75,
    rentalType: "daily" as const,
    quantity: 8,
    condition: "Excellent",
    brand: "Fujifilm",
    model: "X-T5 + XC 18-55mm",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
    terms: "Cleaning fee applies for sand or smoke use. Missing accessories charged at retail cost.",
  },
  {
    name: "Komatsu PC210 LC Excavator",
    description:
      "21-ton tracked excavator for trenching, road work, and site preparation with bucket and quick-coupler.",
    category: EQUIPMENT_CATEGORIES[0],
    location: "Rajshahi, Bangladesh",
    price: 390,
    rentalType: "daily" as const,
    quantity: 3,
    condition: "Good",
    brand: "Komatsu",
    model: "PC210 LC-11",
    image:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80",
    terms: "Certified operator required. Minimum 3 days; fuel and transport charges apply.",
  },
];

const seedReviews = [
  {
    name: "Nusrat Jahan",
    rating: 5,
    comment:
      "The excavator arrived on time and the owner was very responsive. The platform made the whole booking simple.",
  },
  {
    name: "Tanvir Ahmed",
    rating: 5,
    comment:
      "Rented a cinema camera for a three-day commercial. Everything was clean, tested, and exactly as described.",
  },
  {
    name: "Maya Chowdhury",
    rating: 4,
    comment:
      "Great pricing and clear rental terms. Payment confirmation was quick and the support team answered my questions.",
  },
  {
    name: "Rakibul Islam",
    rating: 5,
    comment:
      "The LED wall package transformed our event. Verified owner, professional delivery, and no hidden charges.",
  },
  {
    name: "Sadia Rahman",
    rating: 4,
    comment:
      "Easy to compare rental types and locations. I will definitely use RentWorx for our next production.",
  },
];

async function upsertUser(input: {
  email: string;
  name: string;
  role: "admin" | "owner";
  password: string;
  image: string;
  phone: string;
  address: string;
}) {
  const user = await User.findOneAndUpdate(
    { email: input.email.toLowerCase() },
    {
      $set: {
        name: input.name,
        emailVerified: true,
        image: input.image,
        role: input.role,
        phone: input.phone,
        address: input.address,
        isActive: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { returnDocument: "after", upsert: true, runValidators: true },
  );

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database handle is unavailable");
  }

  await db.collection("account").updateOne(
    {
      userId: user._id,
      providerId: "credential",
      accountId: user.id,
    },
    {
      $set: {
        password: await hashPassword(input.password),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  return user;
}

async function runSeed() {
  if (!env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI before running the seed script");
  }

  await connectDB();

  const admin = await upsertUser({
    email: env.ADMIN_EMAIL,
    name: "RentWorx Admin",
    role: "admin",
    password: env.ADMIN_PASSWORD,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    phone: "+880 1700 000100",
    address: "RentWorx Operations, Dhaka",
  });

  const owner = await upsertUser({
    email: env.OWNER_EMAIL,
    name: "Ahsan Equipment Co.",
    role: "owner",
    password: env.OWNER_PASSWORD,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    phone: "+880 1700 000200",
    address: "32 Industrial Avenue, Dhaka",
  });

  const ownerInfo = {
    name: owner.name,
    email: owner.email,
    image: owner.image,
  };

  for (const [index, item] of seedEquipment.entries()) {
    await Equipment.findOneAndUpdate(
      { seedKey: `rentworx-equipment-${index + 1}` },
      {
        $set: {
          seedKey: `rentworx-equipment-${index + 1}`,
          ownerId: owner.id,
          ownerInfo,
          ...item,
          quantity: item.quantity,
          availableQuantity: item.quantity,
          status: "approved",
          ratingAverage: 4.5 + (index % 5) * 0.1,
          reviewCount: 12 + index * 3,
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  for (const [index, review] of seedReviews.entries()) {
    await Review.findOneAndUpdate(
      { seedKey: `rentworx-review-${index + 1}` },
      {
        $set: {
          seedKey: `rentworx-review-${index + 1}`,
          customerName: review.name,
          rating: review.rating,
          comment: review.comment,
          isApproved: true,
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  const counts = {
    users: await User.countDocuments(),
    equipment: await Equipment.countDocuments(),
    reviews: await Review.countDocuments(),
  };

  console.log("RentWorx seed completed.");
  console.log(`Admin: ${admin.email} / ${env.ADMIN_PASSWORD}`);
  console.log(`Owner: ${owner.email} / ${env.OWNER_PASSWORD}`);
  console.log(counts);
}

runSeed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
