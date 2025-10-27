import { useState } from 'react';
import { Code, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function DevLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (import.meta.env.PROD) return null;

  const testAccounts = [
    { email: 'admin@test.com', role: 'Admin', password: 'admin123', color: 'purple' },
    { email: 'tacoparadise@example.com', role: 'Food Truck Owner', password: 'Password123!', color: 'blue' },
    { email: 'customer@test.com', role: 'Customer', password: 'customer123', color: 'green' },
  ];

  const handleQuickLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: email.includes('admin') ? 'Admin User' : email.includes('customer') ? 'Test Customer' : 'Test User',
                role: email.includes('admin') ? 'admin' : email.includes('customer') ? 'customer' : 'food_truck_owner',
              },
            },
          });

          if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
          }

          if (email.includes('admin')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: session } = await supabase.auth.getSession();
            if (session.session?.user) {
              await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.session.user.id);
            }
          }

          window.location.reload();
        } else {
          setError(error.message);
        }
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="Developer Quick Login"
      >
        <Code size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Developer Quick Login</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Click any account to instantly sign in (Development only)
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {testAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleQuickLogin(account.email, account.password)}
                  disabled={loading}
                  className={`w-full p-4 rounded-lg border-2 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    account.color === 'purple'
                      ? 'border-purple-200 hover:border-purple-400 bg-purple-50'
                      : account.color === 'blue'
                      ? 'border-blue-200 hover:border-blue-400 bg-blue-50'
                      : 'border-green-200 hover:border-green-400 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${
                        account.color === 'purple'
                          ? 'text-purple-900'
                          : account.color === 'blue'
                          ? 'text-blue-900'
                          : 'text-green-900'
                      }`}>
                        {account.role}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{account.email}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      account.color === 'purple'
                        ? 'bg-purple-200 text-purple-800'
                        : account.color === 'blue'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      Click to login
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This button only appears in development mode. Use the seed data script in the console to populate sample food trucks.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
