# Car Enthusiasts E-commerce Platform

A full-stack e-commerce application for car enthusiasts, featuring user authentication, product browsing, shopping cart functionality, and admin capabilities.

## 📋 Features

### Customer Features
- **User Authentication**: Secure registration and login system
- **Product Browsing**: Browse available cars with detailed information
- **Shopping Cart**: Add products to cart, manage quantities, and checkout
- **Product Details**: View comprehensive information about each vehicle
- **Responsive Design**: Optimized for all device sizes

### Admin Features
- **Product Management**: Add new vehicles to the catalog
- **Inventory Control**: Manage product availability and details

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3
- Tailwind CSS for styling
- Vanilla JavaScript
- Font Awesome icons

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication

## 💻 Usage

### Customer Flow

1. Register for an account or log in
2. Browse available cars in the store
3. View detailed information about specific cars
4. Add desired cars to your shopping cart
5. Proceed to checkout


### Admin Flow

1. Log in with admin credentials
2. Navigate to the admin dashboard
3. Add new products or manage existing inventory

## 💻 Usage

### Customer Flow

1. Register for an account or log in
2. Browse available cars in the store
3. View detailed information about specific cars
4. Add desired cars to your shopping cart
5. Proceed to checkout


### Admin Flow

1. Log in with admin credentials
2. Navigate to the admin dashboard
3. Add new products or manage existing inventory


## 🔌 API Endpoints

### Authentication

- `POST /register` - Register a new user
- `POST /login` - Authenticate a user and receive a token


### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Add a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)


### Cart

- `GET /api/cart` - Get the current user's cart
- `POST /api/cart` - Add a product to cart
- `DELETE /api/cart/:productId` - Remove a product from cart

## 🎨 Styling

The application uses Tailwind CSS for styling with custom component definitions. The main styling files are:

- `input.css` - Source Tailwind CSS file with component definitions
- `main.css` - Compiled Tailwind CSS output
- `styles.css` - Additional custom styles

Made with ❤️ by CJ
