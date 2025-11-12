import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkPrices() {
  const priceIds = [
    { name: 'Starter', id: process.env.STRIPE_PRICE_STARTER },
    { name: 'Pro', id: process.env.STRIPE_PRICE_PRO },
    { name: 'Enterprise', id: process.env.STRIPE_PRICE_ENTERPRISE },
  ];

  console.log('Checking Stripe Prices:\n');

  for (const { name, id } of priceIds) {
    try {
      const price = await stripe.prices.retrieve(id, {
        expand: ['product'],
      });

      console.log(`${name} Plan (${id}):`);
      console.log(`  Product: ${price.product.name}`);
      console.log(`  Amount: $${(price.unit_amount / 100).toFixed(2)}`);
      console.log(`  Currency: ${price.currency.toUpperCase()}`);
      console.log(`  Interval: ${price.recurring?.interval}`);
      console.log(`  Active: ${price.active}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error fetching ${name}:`, error.message);
      console.log('');
    }
  }

  process.exit(0);
}

checkPrices();
