/**
 * Quick Seed Script
 * Run this in the browser console to populate sample data
 *
 * Instructions:
 * 1. Open your browser's developer console (F12)
 * 2. Copy and paste this entire file into the console
 * 3. Press Enter
 * 4. Wait for "Database seed completed!" message
 */

import { seedDatabase } from './seedData.ts';

console.log('Starting database seed...');
console.log('This will create 6 food trucks with menus, locations, and reviews');

seedDatabase()
  .then(() => {
    console.log('✅ SUCCESS! Database seeded successfully');
    console.log('Refresh the page to see the sample food trucks');
  })
  .catch((error) => {
    console.error('❌ ERROR seeding database:', error);
  });
