import React, { useEffect, useState } from 'react';
import { getUserSubscription, UserSubscription } from '../../lib/stripe';
import { getProductByPriceId } from '../../stripe-config';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Alert } from '../ui/Alert';

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await getUserSubscription();
      setSubscription(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load subscription status: {error}
      </Alert>
    );
  }

  if (!subscription || !subscription.price_id) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Subscription Status</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No active subscription</p>
        </CardContent>
      </Card>
    );
  }

  const product = getProductByPriceId(subscription.price_id);
  const isActive = subscription.subscription_status === 'active';

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Current Subscription</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="font-medium">Plan: </span>
            <span className="text-gray-900">
              {product?.name || 'Unknown Plan'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Status: </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {subscription.subscription_status}
            </span>
          </div>

          {subscription.current_period_end && (
            <div>
              <span className="font-medium">
                {subscription.cancel_at_period_end ? 'Expires: ' : 'Renews: '}
              </span>
              <span className="text-gray-900">
                {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription.payment_method_last4 && (
            <div>
              <span className="font-medium">Payment Method: </span>
              <span className="text-gray-900">
                {subscription.payment_method_brand?.toUpperCase()} ending in {subscription.payment_method_last4}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}