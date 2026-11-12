# KTL WEBSITE 

Build a complete, modern, professional e-commerce website and Android Admin App system for KTL PRIVATE LIMITED.



1. Website Design



- Premium, professional blue-and-white design.

- Fully responsive for mobile, tablet, and desktop.

- Company name: KTL PRIVATE LIMITED.

- Homepage with product search, categories, featured products, offers, and customer support.

- Clean product cards with product images, prices, and a blue “View Product” button.



2. Product Categories



Create these categories:



1. Electronics: Mobiles, laptops, computers, TVs, cameras, speakers, accessories.

2. Home Appliances: Refrigerators, washing machines, ACs, coolers, kitchen appliances.

3. Furniture: Beds, sofas, tables, chairs, wardrobes, office furniture.

4. Office Equipment: Printers, photocopiers, biometric machines, shredders, office devices.



Allow the admin to add, edit, hide, and delete categories.



3. Product Details



Every product must support:



- Product name and category.

- Multiple product photos with image upload.

- Product price and booking amount.

- Detailed description and specifications.

- Quality, brand, model, warranty, and stock quantity.

- Active/inactive product status.

- Blue “View Product” and “Book Now” buttons.



When a customer clicks “View Product,” open a complete product detail page.



4. QR Code and Booking



On the product detail page, show:



- Product price.

- Configurable payment QR code.

- Promotional message below the QR code.

- Booking amount.

- Customer name and mobile number fields.

- Booking submission and order reference.



Allow the admin to change the QR image, promotional message, and booking amount from the admin dashboard.



5. Payment Gateway



Integrate a suitable payment gateway for India, such as Razorpay, subject to merchant eligibility and approval.



- Support UPI and other enabled payment methods.

- Create payments through a secure backend.

- Verify payment status server-side.

- Update orders only after verified payment.

- Never expose payment secret keys in frontend code.

- Keep QR payments and gateway payments separately identifiable.



Do not simulate successful payments.



6. WhatsApp Customer Support



- Admin can update the WhatsApp support number.

- Display a WhatsApp support button on product pages.

- Open WhatsApp directly with a prefilled message containing the product name and price.

- Include booking enquiry and order reference where available.



7. Admin Dashboard



Create a secure admin dashboard with login and these sections:



- Overview dashboard.

- Products: Add, edit, delete, publish/unpublish.

- Categories management.

- Product photo upload.

- Pricing and booking amount management.

- Payment QR image management.

- Promotional text and offers.

- WhatsApp support number.

- Orders and bookings.

- Payment status and order status.

- Stock management.

- Customer enquiries.

- Store settings.



Changes made in the admin dashboard must automatically appear on the public website.



8. Backend and Database



Use Supabase for:



- Database.

- Admin authentication.

- Product and category records.

- Product image storage.

- Store settings.

- Bookings and orders.

- Payment references and statuses.



Implement Row Level Security (RLS). Only authorized administrators may change products, payment settings, or orders. Public users must not be able to access private customer information.



9. Android Admin App



Design the admin interface mobile-first so it works smoothly on Android. Prepare the project for installation as an Android APK using Capacitor or another appropriate Android wrapper. The admin app and website must use the same backend and database.



10. Domain and Deployment



Prepare the website for a custom domain that I will purchase for KTL PRIVATE LIMITED. Make it deployable on a suitable hosting provider with HTTPS.



11. Important Requirements



- Build a working application, not just a static design.

- Use real database integration, not local demo data as the final implementation.

- Include loading states, validation, error handling, and success messages.

- Do not store payment secrets in the frontend.

- Do not claim that the APK or payment gateway is ready until actually configured and tested.

- Add privacy policy, terms and conditions, shipping policy, and refund/return policy pages.

- Provide clear setup and deployment instructions.



First build the complete responsive website and secure admin dashboard. Then integrate the database, payments, and WhatsApp support. Finally prepare the Android APK build instructions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0a1cc6fe-0565-4041-9441-a8186a720f3b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
