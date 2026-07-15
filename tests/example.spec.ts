import { test, expect } from '@playwright/test';

const clearSession = async (page: any) => {
  await page.goto('http://localhost:8080/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForTimeout(1000);
};

test.describe('ShopCity LK - Full System Test', () => {

  // TC01 - Homepage
  test('TC01 - Homepage loads with shops and products', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await expect(page).toHaveTitle(/ShopCity LK/);
    await expect(page.getByRole('heading', { name: /Welcome to Sri Lanka/i })).toBeVisible();
    await expect(page.getByText('Verified Physical Store').first()).toBeVisible();
    await expect(page.getByText('iPhone 15 Fast Charger').first()).toBeVisible();
  });

  // TC02 - Shops Page
  test('TC02 - Shops page shows all shops', async ({ page }) => {
    await page.goto('http://localhost:8080/shops');
    await expect(page.getByText('Kandy Fashion House').first()).toBeVisible();
    await expect(page.getByText('Galle Home Store').first()).toBeVisible();
    await expect(page.getByText('Jaffna Book Bazaar').first()).toBeVisible();
    await expect(page.getByText('Lanka Beauty Co.').first()).toBeVisible();
  });

  // TC03 - Compare Page
  test('TC03 - Compare page shows product prices', async ({ page }) => {
    await page.goto('http://localhost:8080/compare');
    await expect(page.getByRole('heading', { name: 'iPhone 15 Fast Charger 20W (USB-C)' })).toBeVisible();
    await expect(page.getByText('Pettah Mobile Center').first()).toBeVisible();
    await expect(page.getByText('Rs. 2,890')).toBeVisible();
  });

  // TC04 - Login Page
  test('TC04 - Login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/login');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  // TC05 - Wrong password
  test('TC05 - Wrong password keeps user on login page', async ({ page }) => {
    await clearSession(page);
    await page.getByPlaceholder('Email').fill('admin@shopcity.lk');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/login/);
  });

  // TC06 - Admin Login
  test('TC06 - Admin login shows admin dashboard button', async ({ page }) => {
    await clearSession(page);
    await page.getByPlaceholder('Email').fill('admin@shopcity.lk');
    await page.getByPlaceholder('Password').fill('Demo@1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/account/, { timeout: 30000 });
    await expect(page.getByText('Admin dashboard')).toBeVisible({ timeout: 15000 });
  });

  // TC07 - Admin Dashboard
  test('TC07 - Admin dashboard shows correct stats', async ({ page }) => {
    await clearSession(page);
    await page.getByPlaceholder('Email').fill('admin@shopcity.lk');
    await page.getByPlaceholder('Password').fill('Demo@1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/account/, { timeout: 30000 });
    await page.getByText('Admin dashboard').click();
    await page.waitForURL(/admin/, { timeout: 15000 });
    await expect(page.getByText('City control panel')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Approved shops')).toBeVisible();
    await expect(page.getByText('Pending approvals')).toBeVisible();
  });

  // TC08 - Seller Login
  test('TC08 - Seller login shows seller dashboard button', async ({ page }) => {
    await clearSession(page);
    await page.getByPlaceholder('Email').fill('seller@shopcity.lk');
    await page.getByPlaceholder('Password').fill('Demo@1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/account/, { timeout: 30000 });
    await expect(page.getByText('Seller dashboard')).toBeVisible({ timeout: 15000 });
  });

  // TC09 - Customer Login
  test('TC09 - Customer login shows order history', async ({ page }) => {
    await clearSession(page);
    await page.getByPlaceholder('Email').fill('customer@shopcity.lk');
    await page.getByPlaceholder('Password').fill('Demo@1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/account/, { timeout: 30000 });
    await expect(page.getByText('Order history')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('iPhone 15 Fast Charger').first()).toBeVisible({ timeout: 15000 });
  });

  // TC10 - Shop Detail Page
  test('TC10 - Shop detail page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/shop/abc-electronics');
    await expect(page.getByText('ABC Electronics').first()).toBeVisible();
    await expect(page.getByText('Verified Physical Store').first()).toBeVisible();
  });

});