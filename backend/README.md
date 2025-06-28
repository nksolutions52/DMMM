# RTA Agent Application Backend

A comprehensive Node.js + Express backend API for the RTA (Road Transport Authority) Agent Application with PostgreSQL database.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Vehicle Management**: Complete CRUD operations for vehicle registration and management
- **Service Orders**: Create and manage service orders with payment tracking
- **Appointments**: Schedule and manage appointments with time slot availability
- **Renewal Management**: Track and process vehicle document renewals
- **Reports & Analytics**: Comprehensive reporting system with various filters
- **Dashboard**: Real-time statistics and activity tracking

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## API Modules

### 1. Authentication (`/api/auth`)
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /logout` - User logout

### 2. Vehicles (`/api/vehicles`)
- `GET /` - Get all vehicles (with pagination and search)
- `GET /:id` - Get vehicle by ID
- `POST /` - Create new vehicle
- `PUT /:id` - Update vehicle
- `DELETE /:id` - Delete vehicle
- `GET /search/:registrationNumber` - Search vehicle by registration number

### 3. Services (`/api/services`)
- `GET /types` - Get all service types
- `GET /orders` - Get all service orders
- `GET /orders/:id` - Get service order by ID
- `POST /orders` - Create new service order
- `PATCH /orders/:id/status` - Update service order status
- `POST /orders/:id/payment` - Make payment for service order

### 4. Appointments (`/api/appointments`)
- `GET /` - Get all appointments
- `GET /:id` - Get appointment by ID
- `POST /` - Create new appointment
- `PUT /:id` - Update appointment
- `PATCH /:id/status` - Update appointment status
- `DELETE /:id` - Delete appointment
- `GET /available-slots/:date` - Get available time slots for a date

### 5. Renewals (`/api/renewals`)
- `GET /` - Get all renewal dues
- `GET /:id` - Get renewal due by ID
- `POST /:id/process` - Create service order from renewal due
- `PATCH /:id/status` - Update renewal due status
- `GET /stats/overview` - Get renewal statistics

### 6. Reports (`/api/reports`)
- `GET /vehicles/registration` - Vehicle registration report
- `GET /services/summary` - Service orders summary report
- `GET /revenue/daily` - Daily revenue report
- `GET /renewals/dues` - Renewal dues report
- `GET /vehicles/by-type` - Vehicles by type report
- `GET /vehicles/by-manufacturer` - Vehicles by manufacturer report
- `GET /appointments/summary` - Appointment summary report

### 7. Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /recent-activity` - Get recent service orders
- `GET /upcoming-renewals` - Get upcoming renewals
- `GET /revenue-summary` - Get revenue summary
- `GET /vehicle-distribution` - Get vehicle type distribution
- `GET /registration-trends` - Get monthly registration trends

## Database Schema

### Core Tables
- **users** - System users (admin, agents)
- **vehicles** - Vehicle registration data
- **puc_details** - PUC certificate details
- **insurance_details** - Insurance policy details
- **fitness_details** - Fitness certificate details (Transport vehicles)
- **permit_details** - Permit details (Transport vehicles)
- **tax_details** - Tax details (Transport vehicles)
- **service_orders** - Service order management
- **appointments** - Appointment scheduling
- **renewal_dues** - Document renewal tracking

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb rta_database
   
   # Run migrations
   npm run migrate
   
   # Seed sample data
   npm run seed
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rta_database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## Default Users

After running the seed script, you can login with:

- **Admin**: admin@rta.gov / password123
- **Agent**: agent@rta.gov / password123

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **Helmet**: Security headers

## Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading with pagination
- **Connection Pooling**: PostgreSQL connection pooling
- **Query Optimization**: Efficient JOIN operations and filtering

## Development

### Adding New Endpoints

1. Create route file in `/routes`
2. Add validation schemas in `/middleware/validation.js`
3. Import and use in `server.js`
4. Update documentation

### Database Migrations

Add new migration scripts in `/scripts` and run:
```bash
node scripts/your-migration.js
```

## Testing

The API can be tested using tools like Postman or curl. Sample requests:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rta.gov","password":"password123"}'

# Get vehicles (with auth token)
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use environment variables for sensitive data
3. Set up SSL/TLS certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging
6. Configure database backups

## Support

For issues and questions, please refer to the API documentation or contact the development team.