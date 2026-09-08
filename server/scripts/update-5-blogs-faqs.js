#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Blog from '../src/models/Blog.js';
import Destination from '../src/models/Destination.js';
import User from '../src/models/User.js';
import { slugify } from '../src/utils/slugify.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to', process.env.MONGODB_URI.split('@').pop()?.split('?')[0]);

const admin = await User.findOne({ role: 'admin' }).lean();
if (!admin) {
  console.error('No admin user found');
  process.exit(1);
}
console.log(`Using admin: ${admin.email} (${admin._id})`);

// Helper to find destination by name
async function findDestinationByName(name) {
  const lower = name.toLowerCase();
  // Try exact match, then includes
  let dest = await Destination.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
  if (dest) return dest;
  // Try contains
  dest = await Destination.findOne({ name: { $regex: new RegExp(lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }).lean();
  if (dest) return dest;
  // Fallback: search by slug
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  dest = await Destination.findOne({ slug: { $regex: new RegExp(slug, 'i') } }).lean();
  return dest;
}

const blogsData = [
  {
    title: "Things To Do in Bali",
    slug: "things-to-do-in-bali",
    excerpt: "Discover the best experiences in Bali, from beaches and temples to waterfalls, rice terraces, and island escapes, in one easy guide.",
    category: "things-to-do",
    destinationName: "Bali",
    content: [
      { type: "heading", level: 2, text: "Why Bali Feels Different" },
      { type: "paragraph", text: "Bali brings together relaxed beach life, ancient temples, volcanic landscapes, and a strong sense of culture. This guide helps you choose what to do based on how you like to travel, not just where to go." },
      { type: "heading", level: 2, text: "Planning Your Days" },
      { type: "paragraph", text: "You can balance Ubud’s art and nature with beach time in the south, and keep one or two days flexible for a day trip or water activity. Short transfers between areas make it easy to see a lot without rushing." },
    ],
    faqs: [
      { question: "What are the must-do experiences in Bali for first-time visitors?", answer: "Most first-time visitors enjoy a mix of Uluwatu’s cliff temples and beaches, a day trip to Nusa Penida for dramatic coastlines, time in Ubud for culture and rice terraces, and an evening with traditional dance or a market walk. Keep one day open for a relaxed beach or spa experience.", displayOrder: 1 },
      { question: "How many days are ideal for Bali?", answer: "Five to seven days gives you a good introduction without feeling rushed. Add two or three extra days if you want to include Gili Islands or a slower Ubud stay.", displayOrder: 2 },
      { question: "Is Bali suitable for families and couples?", answer: "Yes. Bali works well for both. Families often prefer beach areas with calm water and easy sightseeing, while couples enjoy Ubud, boutique stays, and sunset experiences. Private drivers and guides make moving around comfortable for all.", displayOrder: 3 },
      { question: "What should I pack for Bali?", answer: "Light, breathable clothing, comfortable walking shoes, swimwear, sun protection, a light rain layer, and a small day bag. If you plan temple visits, carry something to cover shoulders and knees.", displayOrder: 4 },
      { question: "Can this Bali plan be customized?", answer: "Yes. You can adjust how many days you spend in Ubud versus the beach, add or skip islands, and choose hotel categories before the trip is confirmed.", displayOrder: 5 },
    ],
  },
  {
    title: "Uncover The Things To Do In Japan: A Guide To Your Ultimate Adventure",
    slug: "uncover-the-things-to-do-in-japan-a-guide-to-your-ultimate-adventure",
    excerpt: "A practical Japan guide covering city highlights, culture, food, and seasonal experiences to help you plan an unforgettable adventure.",
    category: "things-to-do",
    destinationName: "Japan",
    content: [
      { type: "heading", level: 2, text: "Japan Beyond the Postcard" },
      { type: "paragraph", text: "Japan blends ultra-modern cities with quiet traditions. This guide focuses on experiences that show both sides, from busy crossings and street food to shrines, gardens, and slower neighbourhoods." },
      { type: "heading", level: 2, text: "How to Structure Your Trip" },
      { type: "paragraph", text: "Group days by city or region, keep travel between cities on fast trains, and leave room for small discoveries like a local market, a garden at sunset, or a neighbourhood izakaya." },
    ],
    faqs: [
      { question: "What are the top things to do in Japan?", answer: "Travellers usually enjoy a blend of city exploration in Tokyo, cultural sites in Kyoto, local food experiences, day trips to nearby nature or historic towns, and one or two unique activities like a tea experience or a themed district walk.", displayOrder: 1 },
      { question: "When is the best time to visit Japan?", answer: "Spring and autumn are popular for pleasant weather and seasonal scenery, but Japan is rewarding year-round. Summer is lively for festivals, winter is ideal for onsen and snow landscapes.", displayOrder: 2 },
      { question: "Is Japan difficult for first-time international travellers?", answer: "Japan is very traveller-friendly. Public transport is punctual, signage is clear, and people are helpful. Learning a few basic phrases and having offline maps makes the trip even smoother.", displayOrder: 3 },
      { question: "How should I handle transport in Japan?", answer: "Intercity travel is best on fast trains, while cities have efficient metro and local trains. A prepaid transport card and a little advance planning for peak travel days are useful.", displayOrder: 4 },
      { question: "Can I customize this Japan itinerary?", answer: "Yes. You can balance city days and nature, add specific interests like food, history, or shopping, and adjust hotel categories before confirmation.", displayOrder: 5 },
    ],
  },
  {
    title: "25 Best Things to Do in Ladakh for an Unforgettable Trip",
    slug: "25-best-things-to-do-in-ladakh-for-an-unforgettable-trip",
    excerpt: "A handpicked list of Ladakh’s most memorable experiences, from monasteries and high passes to lakes, valleys, and quiet village life.",
    category: "things-to-do",
    destinationName: "Ladakh",
    content: [
      { type: "heading", level: 2, text: "Why Ladakh Stays With You" },
      { type: "paragraph", text: "Ladakh is high, dry, and deeply peaceful. The combination of stark mountains, high passes, monasteries, and warm local hospitality makes every day feel distinct, even on a relaxed itinerary." },
      { type: "heading", level: 2, text: "Using This List" },
      { type: "paragraph", text: "Use this collection to choose experiences that match your fitness, season, and travel style, then build a route that keeps acclimatization and drive times comfortable." },
    ],
    faqs: [
      { question: "What are the most popular things to do in Ladakh?", answer: "Popular experiences include visiting monasteries like Hemis and Thiksey, crossing high passes such as Khardung La, spending time by Pangong and Tso Moriri, exploring Nubra Valley, and walking through local villages and markets.", displayOrder: 1 },
      { question: "How should I prepare for high altitude in Ladakh?", answer: "Arrive with a relaxed first day, stay hydrated, avoid strenuous activity immediately, and follow a gradual route. Consult your doctor if you have any health concerns before travelling.", displayOrder: 2 },
      { question: "What is the best season for Ladakh?", answer: "Late May to September offers the most accessible roads and clear views. Winter has a very different, quiet charm but requires specific preparation for cold and limited access.", displayOrder: 3 },
      { question: "What should I pack for Ladakh?", answer: "Warm layers, a windproof outer, comfortable walking shoes, sun protection, lip balm, basic medicines, and a reusable water bottle. Even in summer, evenings can be cold.", displayOrder: 4 },
      { question: "Can I combine Ladakh with nearby regions?", answer: "Yes. Many travellers add Nubra Valley, Pangong, or Tso Moriri as extensions, depending on available days and road conditions at the time of travel.", displayOrder: 5 },
    ],
  },
  {
    title: "Places To Visit in Kasauli: A Comprehensive Travel Guide",
    slug: "places-to-visit-in-kasauli-a-comprehensive-travel-guide",
    excerpt: "A calm, practical guide to Kasauli’s viewpoints, nature walks, heritage spots, and easygoing experiences for a short mountain break.",
    category: "places-to-visit",
    destinationName: "Himachal Pradesh",
    content: [
      { type: "heading", level: 2, text: "Kasauli at a Glance" },
      { type: "paragraph", text: "Kasauli is a small, unhurried hill station where forest walks, old-world charm, and wide valley views make for a restorative short trip. It suits families, couples, and anyone looking for a quiet mountain pause." },
      { type: "heading", level: 2, text: "How to Use This Guide" },
      { type: "paragraph", text: "Pick a few viewpoints and walks for each day, keep the pace relaxed, and leave time for unplanned strolls through pine-lined lanes and local cafés." },
    ],
    faqs: [
      { question: "What are the best places to visit in Kasauli?", answer: "Visitors often enjoy viewpoints like Monkey Point and Sunset Point, nature walks such as Gilbert Trail, heritage sites like Christ Church, and relaxed evenings around the main market area.", displayOrder: 1 },
      { question: "How long should I stay in Kasauli?", answer: "Two to three days is usually enough for the main viewpoints and walks. Add a day if you want a very relaxed pace or side visits nearby.", displayOrder: 2 },
      { question: "Is Kasauli suitable for families?", answer: "Yes. Most walks and viewpoints are easygoing, and the town’s compact size makes it comfortable for families and older travellers.", displayOrder: 3 },
      { question: "What is the best time to visit Kasauli?", answer: "Kasauli is pleasant through most of the year. Summers are mild, winters are quiet and cold, and the post-monsoon months bring clear views.", displayOrder: 4 },
      { question: "Can I do Kasauli as a weekend trip?", answer: "Yes. Its proximity to Chandigarh and Delhi makes it a popular weekend destination, especially for short, low-effort mountain breaks.", displayOrder: 5 },
    ],
  },
  {
    title: "Get To Know The Best Places To Visit In Vietnam",
    slug: "get-to-know-the-best-places-to-visit-in-vietnam",
    excerpt: "An easy introduction to Vietnam’s most loved places, from the north’s bays and capital to the centre’s heritage towns and the south’s vibrant city life.",
    category: "places-to-visit",
    destinationName: "Vietnam",
    content: [
      { type: "heading", level: 2, text: "Vietnam in Short" },
      { type: "paragraph", text: "Vietnam stretches from north to south with a clear change of character along the way. This guide groups places by region so you can see how they fit together on a single trip." },
      { type: "heading", level: 2, text: "Planning Around Regions" },
      { type: "paragraph", text: "Spend a few days in each region rather than rushing. The north suits culture and seascapes, the centre offers heritage and beaches, and the south brings city energy and river life." },
    ],
    faqs: [
      { question: "What are the best places to visit in Vietnam?", answer: "Travellers often include Hanoi, Ha Long Bay, Hoi An, Da Nang, Ba Na Hills, and Ho Chi Minh City, balancing city life, heritage, and coastal scenery.", displayOrder: 1 },
      { question: "How many days are enough for Vietnam?", answer: "Six to eight days covers the highlights at a comfortable pace. A longer trip lets you add more time in one region or include an extra city.", displayOrder: 2 },
      { question: "Is Vietnam good for first-time international travellers?", answer: "Yes. Popular routes are well connected, local hospitality is warm, and guided support makes moving between regions straightforward.", displayOrder: 3 },
      { question: "What should I pack for Vietnam?", answer: "Light, breathable clothing, comfortable walking shoes, sun protection, a light rain layer, and a small day bag for city and boat days.", displayOrder: 4 },
      { question: "Can this Vietnam route be customized?", answer: "Yes. You can adjust the number of days per region, choose hotel categories, and add or skip specific experiences before the trip is confirmed.", displayOrder: 5 },
    ],
  },
];

for (const data of blogsData) {
  const dest = await findDestinationByName(data.destinationName);
  const destinationId = dest ? dest._id : null;
  if (dest) console.log(`Destination for "${data.title}" -> ${dest.name} (${dest._id})`);
  else console.log(`Destination for "${data.title}" -> NOT FOUND for "${data.destinationName}", using null`);

  let existing = await Blog.findOne({ slug: data.slug }).lean();
  if (!existing) {
    // also try by title
    existing = await Blog.findOne({ title: data.title }).lean();
  }

  if (existing) {
    console.log(`Updating existing blog: "${data.title}" (${existing.slug}) id=${existing._id}`);
    const update = {
      faqs: data.faqs,
      published: true,
      featured: false,
    };
    // Ensure slugs remain correct, but don't change other fields if they exist
    const res = await Blog.findByIdAndUpdate(existing._id, { $set: update }, { new: true, runValidators: true });
    console.log(` -> updated, faqs: ${res.faqs.length}, published: ${res.published}, featured: ${res.featured}`);
  } else {
    console.log(`Creating new blog: "${data.title}" slug=${data.slug}`);
    const doc = new Blog({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: {},
      category: data.category,
      tags: [],
      destinationId: destinationId,
      author: admin.name || '24x7Chhutti Team',
      featured: false,
      published: true,
      publishedAt: new Date(),
      seoTitle: data.title + ' | 24x7Chhutti',
      seoDescription: data.excerpt.slice(0, 150),
      faqs: data.faqs,
      createdBy: admin._id,
      updatedBy: admin._id,
    });
    await doc.save();
    console.log(` -> created id=${doc._id} slug=${doc.slug} faqs=${doc.faqs.length}`);
  }
}

console.log('\nVerification:');
const all = await Blog.find({}).lean();
console.log(`Total blogs: ${all.length}`);
for (const b of all) {
  console.log(`- "${b.title}" | slug:${b.slug} | faqs:${(b.faqs||[]).length} | published:${b.published} featured:${b.featured} | cat:${b.category} | dest:${b.destinationId}`);
  if (b.faqs && b.faqs.length) {
    console.log(`  FAQs: ${b.faqs.map(f=>`[${f.displayOrder}] ${f.question.slice(0,40)}...`).join(' | ')}`);
  }
}

await mongoose.disconnect();
console.log('Done');
