import { useState } from 'react';
import { Database } from 'lucide-react';
import { seedDatabase } from '../utils/seedData';

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (import.meta.env.PROD) return null;

  const handleSeed = async () => {
    if (!confirm('This will create 6 sample food trucks with menus, locations, and reviews. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await seedDatabase();
      setMessage('✅ Success! 6 food trucks created. Refresh the page to see them.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      console.error('Seed error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Seed Sample Data"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <Database size={24} />
        )}
      </button>

      {(message || error) && (
        <div className="absolute bottom-16 left-0 w-64 p-3 bg-white rounded-lg shadow-xl border-2">
          {message && <p className="text-sm text-green-600 font-medium">{message}</p>}
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
