import { randomBytes } from 'crypto';
import { env } from '../config/env.js';

/**
 * Test-data builders. Every call returns NEW unique data, so tests never depend on records
 * created by an earlier run (the demo site is public and shared; nothing is ever reset).
 */

function uniqueSuffix() {
  return `${Date.now()}_${randomBytes(3).toString('hex')}`;
}

export function uniqueEmail(prefix = 'dws') {
  return `${prefix}_${uniqueSuffix()}@${env.emailDomain}`;
}

export function buildUser(overrides = {}) {
  return {
    gender: 'F',
    firstName: 'Ada',
    lastName: `Tester${randomBytes(2).toString('hex')}`,
    email: uniqueEmail('user'),
    password: env.userPassword,
    ...overrides,
  };
}

export const COUNTRY = { unitedStates: 1, canada: 2 };

export function buildAddress(user, overrides = {}) {
  const tag = randomBytes(2).toString('hex');
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    countryId: COUNTRY.unitedStates,
    countryName: 'United States',
    city: `Austin${tag}`,
    address1: `${100 + Math.floor(Math.random() * 900)} Test Street ${tag}`,
    zip: '73301',
    phone: '5551234567',
    ...overrides,
  };
}

/** Messages the site shows, copied from the live pages. */
export const MESSAGES = {
  registrationCompleted: 'Your registration completed',
  emailAlreadyExists: 'The specified email already exists',
  loginUnsuccessful: 'Login was unsuccessful. Please correct the errors and try again.',
  wrongCredentials: 'The credentials provided are incorrect',
  noCustomerAccount: 'No customer account found',
  passwordMismatch: 'The password and confirmation password do not match.',
  passwordTooShort: 'The password should have at least 6 characters.',
  wrongEmail: 'Wrong email',
  addedToCart: 'The product has been added to your shopping cart',
  wishlistDisabled: 'Wishlist is disabled for this product',
  productNotFound: 'No product found with the specified ID',
  cartEmpty: 'Your Shopping Cart is empty!',
  noSearchResults: 'No products were found that matched your criteria.',
  newsletterThanks: 'Thank you for signing up!',
  newsletterInvalid: 'Enter valid email',
  orderProcessed: 'Your order has been successfully processed!',
  checkoutCartEmpty: 'Your cart is empty',
  cityRequired: 'City is required',
};
