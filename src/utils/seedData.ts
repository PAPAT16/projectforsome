import { supabase } from '../lib/supabase';

const SAMPLE_FOOD_TRUCKS = [
  {
    truck_name: "Taco Paradise",
    description: "Authentic Mexican street tacos with fresh ingredients and homemade salsas. Family recipes passed down for generations.",
    cuisine_types: ["Mexican", "Tacos", "Street Food"],
    phone: "(555) 123-4567",
    email: "info@tacoparadise.com",
    logo_url: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "premium",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7128, lng: -74.0060, address: "Lower Manhattan, New York, NY", zip_code: "10007" },
    menu_items: [
      { item_name: "Al Pastor Taco", description: "Marinated pork with pineapple", price: 4.50, category: "Tacos", image_url: "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Carne Asada Taco", description: "Grilled steak with cilantro and onions", price: 5.00, category: "Tacos", image_url: "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Fish Taco", description: "Battered fish with cabbage slaw", price: 5.50, category: "Tacos", image_url: "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Vegetarian Burrito", description: "Black beans, rice, and fresh veggies", price: 9.00, category: "Burritos", image_url: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
  {
    truck_name: "Burger Express",
    description: "Gourmet burgers made with premium grass-fed beef and artisan buns. The best burgers in the city!",
    cuisine_types: ["American", "Burgers", "Fast Food"],
    phone: "(555) 234-5678",
    email: "contact@burgerexpress.com",
    logo_url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "premium",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7150, lng: -74.0080, address: "Tribeca, New York, NY", zip_code: "10013" },
    menu_items: [
      { item_name: "Classic Cheeseburger", description: "Beef patty with cheddar cheese", price: 8.50, category: "Burgers", image_url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Bacon BBQ Burger", description: "Bacon, BBQ sauce, and onion rings", price: 10.00, category: "Burgers", image_url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Veggie Burger", description: "House-made black bean patty", price: 9.00, category: "Burgers", image_url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Loaded Fries", description: "Fries with cheese, bacon, and ranch", price: 6.50, category: "Sides", image_url: "https://images.pexels.com/photos/1893555/pexels-photo-1893555.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
  {
    truck_name: "Sushi Roll",
    description: "Fresh sushi and sashimi prepared daily. Traditional Japanese cuisine with a modern twist.",
    cuisine_types: ["Japanese", "Sushi", "Asian"],
    phone: "(555) 345-6789",
    email: "hello@sushiroll.com",
    logo_url: "https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "basic",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7180, lng: -74.0020, address: "SoHo, New York, NY", zip_code: "10012" },
    menu_items: [
      { item_name: "California Roll", description: "Crab, avocado, and cucumber", price: 7.00, category: "Rolls", image_url: "https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Spicy Tuna Roll", description: "Tuna with spicy mayo", price: 8.50, category: "Rolls", image_url: "https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Dragon Roll", description: "Eel and avocado", price: 12.00, category: "Rolls", image_url: "https://images.pexels.com/photos/1148086/pexels-photo-1148086.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Miso Soup", description: "Traditional Japanese soup", price: 3.50, category: "Soup", image_url: "https://images.pexels.com/photos/5920742/pexels-photo-5920742.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
  {
    truck_name: "Pizza on Wheels",
    description: "Authentic wood-fired pizza made with imported Italian ingredients. A taste of Italy on the go!",
    cuisine_types: ["Italian", "Pizza", "Mediterranean"],
    phone: "(555) 456-7890",
    email: "orders@pizzaonwheels.com",
    logo_url: "https://images.pexels.com/photos/365459/pexels-photo-365459.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "premium",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7128, lng: -74.0060, address: "Financial District, New York, NY", zip_code: "10004" },
    menu_items: [
      { item_name: "Margherita Pizza", description: "Fresh mozzarella, basil, and tomato", price: 11.00, category: "Pizza", image_url: "https://images.pexels.com/photos/365459/pexels-photo-365459.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", price: 12.50, category: "Pizza", image_url: "https://images.pexels.com/photos/365459/pexels-photo-365459.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Vegetarian Pizza", description: "Bell peppers, onions, mushrooms, olives", price: 11.50, category: "Pizza", image_url: "https://images.pexels.com/photos/365459/pexels-photo-365459.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Garlic Knots", description: "Fresh baked with garlic butter", price: 4.00, category: "Sides", image_url: "https://images.pexels.com/photos/1893555/pexels-photo-1893555.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
  {
    truck_name: "BBQ Heaven",
    description: "Slow-smoked meats with homemade BBQ sauces. Real southern BBQ in the heart of the city.",
    cuisine_types: ["BBQ", "American", "Southern"],
    phone: "(555) 567-8901",
    email: "info@bbqheaven.com",
    logo_url: "https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "basic",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7100, lng: -74.0100, address: "Battery Park, New York, NY", zip_code: "10004" },
    menu_items: [
      { item_name: "Pulled Pork Sandwich", description: "Slow-smoked pork with coleslaw", price: 9.50, category: "Sandwiches", image_url: "https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Beef Brisket Plate", description: "Texas-style brisket with sides", price: 14.00, category: "Plates", image_url: "https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "BBQ Ribs", description: "Fall-off-the-bone ribs", price: 16.50, category: "Plates", image_url: "https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Mac and Cheese", description: "Creamy homemade mac and cheese", price: 5.00, category: "Sides", image_url: "https://images.pexels.com/photos/1446635/pexels-photo-1446635.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
  {
    truck_name: "Thai Street Kitchen",
    description: "Authentic Thai street food with bold flavors and fresh ingredients. Spice levels customizable!",
    cuisine_types: ["Thai", "Asian", "Street Food"],
    phone: "(555) 678-9012",
    email: "contact@thaistreetkitchen.com",
    logo_url: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400",
    subscription_tier: "premium",
    subscription_status: "active",
    is_active: true,
    location: { lat: 40.7200, lng: -74.0000, address: "West Village, New York, NY", zip_code: "10014" },
    menu_items: [
      { item_name: "Pad Thai", description: "Rice noodles with shrimp and peanuts", price: 10.00, category: "Noodles", image_url: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Green Curry", description: "Spicy coconut curry with vegetables", price: 11.50, category: "Curry", image_url: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Tom Yum Soup", description: "Hot and sour soup with shrimp", price: 8.00, category: "Soup", image_url: "https://images.pexels.com/photos/5920742/pexels-photo-5920742.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { item_name: "Spring Rolls", description: "Fresh vegetables wrapped in rice paper", price: 6.50, category: "Appetizers", image_url: "https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=400" },
    ],
  },
];

const SAMPLE_REVIEWS = [
  { rating: 5, comment: "Best tacos I've ever had! The al pastor is absolutely amazing." },
  { rating: 5, comment: "Incredible food and super friendly staff. Highly recommend!" },
  { rating: 4, comment: "Really good burgers. A bit pricey but worth it for the quality." },
  { rating: 5, comment: "Fresh sushi and great portions. Will definitely be back!" },
  { rating: 5, comment: "The pizza is authentic and delicious. Love the wood-fired taste!" },
  { rating: 4, comment: "Great BBQ! The brisket is tender and flavorful." },
  { rating: 5, comment: "Amazing Thai food! Perfect spice level and very fresh." },
];

export async function seedDatabase() {
  console.log('Starting database seed...');

  for (const truckData of SAMPLE_FOOD_TRUCKS) {
    const ownerEmail = `${truckData.truck_name.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const ownerPassword = 'Password123!';

    let ownerId: string;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', ownerEmail)
      .maybeSingle();

    if (existingProfile) {
      ownerId = existingProfile.id;
      console.log(`Owner already exists: ${ownerEmail}`);
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerEmail,
        password: ownerPassword,
        options: {
          data: {
            full_name: `${truckData.truck_name} Owner`,
            role: 'food_truck_owner',
          },
        },
      });

      if (authError || !authData.user) {
        console.error(`Failed to create owner: ${ownerEmail}`, authError);
        continue;
      }

      ownerId = authData.user.id;
      console.log(`Created owner: ${ownerEmail}`);
    }

    const { data: existingTruck } = await supabase
      .from('food_trucks')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    let truckId: string;

    if (existingTruck) {
      truckId = existingTruck.id;
      console.log(`Truck already exists: ${truckData.truck_name}`);
    } else {
      const { data: truck, error: truckError } = await supabase
        .from('food_trucks')
        .insert({
          owner_id: ownerId,
          truck_name: truckData.truck_name,
          description: truckData.description,
          cuisine_types: truckData.cuisine_types,
          phone: truckData.phone,
          email: truckData.email,
          logo_url: truckData.logo_url,
          subscription_tier: truckData.subscription_tier,
          subscription_status: truckData.subscription_status,
          is_active: truckData.is_active,
        })
        .select()
        .single();

      if (truckError || !truck) {
        console.error(`Failed to create truck: ${truckData.truck_name}`, truckError);
        continue;
      }

      truckId = truck.id;
      console.log(`Created truck: ${truckData.truck_name}`);

      const { error: locationError } = await supabase
        .from('food_truck_locations')
        .insert({
          food_truck_id: truckId,
          latitude: truckData.location.lat,
          longitude: truckData.location.lng,
          address: truckData.location.address,
          zip_code: truckData.location.zip_code,
          is_current: true,
        });

      if (locationError) {
        console.error(`Failed to create location for: ${truckData.truck_name}`, locationError);
      }

      const menuInserts = truckData.menu_items.map(item => ({
        food_truck_id: truckId,
        ...item,
      }));

      const { error: menuError } = await supabase
        .from('food_truck_menu_items')
        .insert(menuInserts);

      if (menuError) {
        console.error(`Failed to create menu items for: ${truckData.truck_name}`, menuError);
      }

      for (let i = 0; i < 3; i++) {
        const review = SAMPLE_REVIEWS[Math.floor(Math.random() * SAMPLE_REVIEWS.length)];
        const customerEmail = `customer${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

        const { data: customerAuth } = await supabase.auth.signUp({
          email: customerEmail,
          password: ownerPassword,
          options: {
            data: {
              full_name: `Customer ${Math.floor(Math.random() * 1000)}`,
              role: 'customer',
            },
          },
        });

        if (customerAuth.user) {
          await supabase.from('reviews').insert({
            food_truck_id: truckId,
            customer_id: customerAuth.user.id,
            rating: review.rating,
            comment: review.comment,
          });
        }
      }
    }
  }

  console.log('Database seed completed!');
}
