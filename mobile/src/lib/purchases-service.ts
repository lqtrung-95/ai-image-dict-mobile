import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API keys — set in your RevenueCat dashboard
// Replace these with your actual keys before submitting to the stores
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

// The entitlement ID configured in the RevenueCat dashboard
export const PREMIUM_ENTITLEMENT = 'premium';

let initialized = false;

export function initPurchases(userId?: string) {
  if (initialized) {
    if (userId) Purchases.logIn(userId).catch(() => {});
    return;
  }

  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) return; // keys not set yet — skip silently

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId ?? null });
  initialized = true;
}

export function loginPurchases(userId: string) {
  if (!initialized) return;
  Purchases.logIn(userId).catch(() => {});
}

export function logoutPurchases() {
  if (!initialized) return;
  Purchases.logOut().catch(() => {});
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isPremium(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  if (!initialized) return [];
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages;
  } catch {
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}
