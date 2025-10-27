import { Database, Code } from 'lucide-react';

export function WelcomeMessage() {
  if (import.meta.env.PROD) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Food Truck Live!</h1>
        <p className="text-lg mb-6">Get started in 2 easy steps:</p>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-700 p-2 rounded-full">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold">Step 1: Add Sample Data</h3>
            </div>
            <p className="text-blue-100">
              Click the <strong>blue Database icon</strong> in the bottom-left corner to populate 6 sample food trucks with menus, locations, and reviews.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-900 p-2 rounded-full">
                <Code size={24} />
              </div>
              <h3 className="text-xl font-bold">Step 2: Quick Login (Optional)</h3>
            </div>
            <p className="text-blue-100">
              Click the <strong>black Code icon</strong> in the bottom-left corner to instantly log in as Admin, Owner, or Customer.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
              <Database size={16} />
            </div>
            <span className="text-sm">Database Icon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <Code size={16} />
            </div>
            <span className="text-sm">Code Icon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
