export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TGsoLv4wz2Db9q',
    priceId: 'price_1SKL3G5k4NG6yuUaVQ5QOkFa',
    name: 'FTL Event Organizer',
    description: 'Food Truck Live – Event Organizer Registration. Create and manage live food truck events with ease. Build event profiles, set dates and times, and invite verified food truck owners to join. Share your event link, track participation, and bring the community together — all for just $9.95 per event.',
    price: 9.95,
    currency: 'USD',
    mode: 'payment'
  },
  {
    id: 'prod_TGsmPHdCwd78kO',
    priceId: 'price_1SKL0z5k4NG6yuUa2HJ93qkF',
    name: 'FTL Premium Membership',
    description: 'Food Truck Live – Premium Membership. Take your food truck business to the next level. Premium members unlock online ordering, social media links, unlimited menu items with photos, and detailed performance stats. Stand out on the map, boost visibility, and reach more hungry customers wherever you roll.',
    price: 29.95,
    currency: 'USD',
    mode: 'subscription'
  },
  {
    id: 'prod_TGsl1tU8Ds3ISs',
    priceId: 'price_1SKKzW5k4NG6yuUaUHdedYtr',
    name: 'FTL Basic Membership',
    description: 'Food Truck Live – Basic Membership. Go live and get discovered. Build your truck profile, upload your logo, and add up to 10 menu items. Show your live location on the customer map and connect directly with nearby foodies. The easiest way to get noticed and grow your following — one stop, one meal at a time.',
    price: 9.95,
    currency: 'USD',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};