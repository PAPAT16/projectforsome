import { useState } from 'react';
import { X, ChevronDown, ChevronRight, HelpCircle, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HelpCenterProps {
  onClose: () => void;
}

export function HelpCenter({ onClose }: HelpCenterProps) {
  const { profile } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const customerContent = {
    title: 'Customer Help Center',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <BookOpen size={20} />,
        content: [
          {
            q: 'How do I find food trucks near me?',
            a: 'Use the map view on the main dashboard to see all active food trucks in your area. You can also use the search bar to find trucks by name, cuisine type, or zip code.',
          },
          {
            q: 'How do I save my favorite trucks?',
            a: 'Click the heart icon on any food truck card to add it to your favorites. You can access your favorites list anytime from the main dashboard.',
          },
          {
            q: 'What do the different filters do?',
            a: 'Filters help you narrow down results by cuisine type (e.g., Mexican, Italian), price range ($-$$$), and rating (1-5 stars). Click the "Filters" button to access these options.',
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Notifications & Alerts',
        icon: <MessageCircle size={20} />,
        content: [
          {
            q: 'How do I enable push notifications?',
            a: 'Go to Profile Settings from the dropdown menu, then enable "Push Notifications" under Notification Preferences. You will receive alerts when your favorite trucks go online or are nearby.',
          },
          {
            q: 'Can I customize what notifications I receive?',
            a: 'Yes! In Profile Settings, you can toggle between push notifications and email notifications. You can also turn off all notifications using the master toggle.',
          },
        ],
      },
      {
        id: 'rewards',
        title: 'Rewards Program',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'How do I earn rewards points?',
            a: 'Earn points by visiting trucks, leaving reviews, and referring friends. Check the Rewards tab to see your current points and available rewards.',
          },
          {
            q: 'What can I redeem points for?',
            a: 'Points can be redeemed for discounts, free items, or special perks at participating food trucks. Each truck sets their own reward offerings.',
          },
        ],
      },
      {
        id: 'affiliate',
        title: 'Affiliate Program',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'What is the affiliate program?',
            a: 'Our affiliate program allows you to earn commissions by referring food truck owners to our platform. You will receive a unique referral link to share.',
          },
          {
            q: 'How do I sign up as an affiliate?',
            a: 'Click on "Affiliate" from the profile dropdown menu. Follow the sign-up process and you will receive your unique affiliate link immediately.',
          },
        ],
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'Is the app free to use?',
            a: 'Yes! Basic features are completely free. We also offer Basic and Premium tiers with additional features like advanced filters and priority support.',
          },
          {
            q: 'How do I contact support?',
            a: 'You can reach our support team through the message icon in the app, or email us at support@foodtrucklive.com. Premium members get priority support.',
          },
          {
            q: 'Can I upload my own profile photo?',
            a: 'Yes! Go to Profile Settings and click the camera icon to upload a profile photo and header image.',
          },
        ],
      },
    ],
  };

  const ownerContent = {
    title: 'Food Truck Owner Help Center',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <BookOpen size={20} />,
        content: [
          {
            q: 'How do I set up my food truck profile?',
            a: 'Click "View My Truck" from the dropdown menu to access your dashboard. Add your truck name, description, cuisine types, menu items, and operating hours.',
          },
          {
            q: 'How do I update my location?',
            a: 'In your truck dashboard, use the "Update Location" feature to set your current location. This helps customers find you on the map in real-time.',
          },
          {
            q: 'How do I go online/offline?',
            a: 'Toggle the "Active Status" switch in your dashboard. When active, customers can see your truck on the map. Set to inactive when not operating.',
          },
        ],
      },
      {
        id: 'menu-management',
        title: 'Menu Management',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'How do I add menu items?',
            a: 'In your dashboard, navigate to the Menu section. Click "Add Item" and fill in the name, description, price, and optional photo. You can also mark items as vegetarian, vegan, or gluten-free.',
          },
          {
            q: 'Can I update prices?',
            a: 'Yes! Edit any menu item to update its price, availability, or details at any time. Changes are reflected immediately to customers.',
          },
        ],
      },
      {
        id: 'reviews',
        title: 'Reviews & Ratings',
        icon: <MessageCircle size={20} />,
        content: [
          {
            q: 'How are ratings calculated?',
            a: 'Your overall rating is the average of all customer reviews. Ratings range from 1-5 stars. Focus on great service and quality food to maintain high ratings!',
          },
          {
            q: 'Can I respond to reviews?',
            a: 'Yes! Click on any review to leave a response. Engaging with customers shows you value their feedback and helps build trust.',
          },
        ],
      },
      {
        id: 'subscriptions',
        title: 'Subscription Tiers',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'What are the different subscription tiers?',
            a: 'Free tier includes basic listings. Basic tier adds advanced analytics and priority placement. Premium tier includes custom branding, priority support, and unlimited menu items.',
          },
          {
            q: 'How do I upgrade my subscription?',
            a: 'Contact our sales team at sales@foodtrucklive.com or upgrade directly from your dashboard settings.',
          },
        ],
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'How do I attract more customers?',
            a: 'Keep your location updated, maintain high ratings, post attractive menu photos, and stay active on the platform. Premium features also help increase visibility.',
          },
          {
            q: 'Can I run promotions?',
            a: 'Yes! Use the promotions feature in your dashboard to create special offers. These are highlighted to customers searching for deals.',
          },
          {
            q: 'What payment methods do you support?',
            a: 'The platform handles discovery and reviews. You manage your own payment processing with customers directly at your truck.',
          },
        ],
      },
    ],
  };

  const adminContent = {
    title: 'Admin Help Center',
    sections: [
      {
        id: 'user-management',
        title: 'User Management',
        icon: <BookOpen size={20} />,
        content: [
          {
            q: 'How do I manage user accounts?',
            a: 'Navigate to the Users tab to view all registered users. You can search by name or email, filter by role (customer/owner), and block/unblock accounts as needed.',
          },
          {
            q: 'What does blocking a user do?',
            a: 'Blocking prevents a user from accessing the platform. Their profile remains in the system but they cannot log in or interact with the app.',
          },
        ],
      },
      {
        id: 'trucks',
        title: 'Truck Management',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'How do I monitor food trucks?',
            a: 'The Trucks tab shows all registered food trucks, their status (online/offline), subscription tiers, and ratings. Use this to ensure quality standards.',
          },
          {
            q: 'Can I edit truck information?',
            a: 'Admins can view all truck details but owners should manage their own content. You can contact owners through the messaging system for required changes.',
          },
        ],
      },
      {
        id: 'features',
        title: 'Feature Management',
        icon: <MessageCircle size={20} />,
        content: [
          {
            q: 'How do I enable or disable features?',
            a: 'Use the Features tab to toggle features on/off and assign them to subscription tiers (Free, Basic, Premium). Changes take effect immediately for all users.',
          },
          {
            q: 'What do the subscription tiers mean?',
            a: 'Free = available to all users, Basic = requires paid basic subscription, Premium = requires premium subscription. Use tiers to monetize advanced features.',
          },
        ],
      },
      {
        id: 'analytics',
        title: 'Analytics & Reports',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'What analytics are available?',
            a: 'View platform-wide metrics including total users, active trucks, reviews, and engagement rates. Use this data to make informed business decisions.',
          },
          {
            q: 'How often is data updated?',
            a: 'Analytics update in real-time as users interact with the platform. Dashboard statistics refresh automatically.',
          },
        ],
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        icon: <HelpCircle size={20} />,
        content: [
          {
            q: 'How do I send messages to users?',
            a: 'Use the Messaging tab to send announcements, updates, or notifications to all users, specific user groups, or individual users.',
          },
          {
            q: 'Can I create contests or promotions?',
            a: 'Yes! Use the Contests tab to create platform-wide promotions, challenges, or reward programs to boost engagement.',
          },
        ],
      },
    ],
  };

  const content =
    profile?.role === 'customer'
      ? customerContent
      : profile?.role === 'food_truck_owner'
      ? ownerContent
      : adminContent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{content.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {content.sections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-orange-600">{section.icon}</span>
                    <span className="font-semibold text-gray-900">{section.title}</span>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown size={20} className="text-gray-600" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600" />
                  )}
                </button>

                {expandedSection === section.id && (
                  <div className="px-6 py-4 space-y-4 bg-white">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{item.q}</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <HelpCircle size={20} className="text-orange-600" />
              Need More Help?
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>Email:</strong> support@foodtrucklive.com
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> 1-800-FOODTRUCK
              </p>
              {profile?.subscription_tier === 'premium' && (
                <p className="text-orange-600 font-medium">
                  ⭐ As a Premium member, you have priority support!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
