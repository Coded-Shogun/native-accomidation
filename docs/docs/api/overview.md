---
sidebar_position: 1
---

# API Overview

The Student Accommodation Management System provides a comprehensive REST API built with Next.js API Routes.

## Base URL

```
http://localhost:3000/api
```

For production:
```
https://your-domain.com/api
```

## Authentication

All API endpoints require authentication except for:
- `POST /api/auth/register`
- `POST /api/auth/login`

### Authentication Flow

1. **Login** to get a session cookie:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

2. **Session Cookie** is automatically set
3. **Subsequent requests** include the session cookie automatically

### Authorization

Endpoints enforce role-based access control (RBAC):

- **Public**: No authentication required
- **Student**: Requires student role or higher
- **Manager**: Requires manager or admin role
- **Admin**: Requires admin role only

## API Structure

### Management APIs

Used by administrators and property managers:

```
/api/management/
├── properties/          # Property management
├── students/            # Student accounts
├── rooms/              # Room inventory
├── leases/             # Lease contracts
├── bursary-providers/  # Funding organizations
├── student-bursaries/  # Bursary assignments
├── maintenance-requests/ # Maintenance oversight
└── dashboard/stats/    # Dashboard statistics
```

### Student APIs

Used by students in the portal:

```
/api/student/
├── accommodation/      # View accommodation details
├── notices/           # Property announcements
├── maintenance-requests/ # Submit and track requests
├── laundry-bookings/  # Book laundry slots
├── visitors/          # Register visitors
├── complaints/        # Submit complaints
├── kiosk-orders/      # Order from kiosk
└── deliveries/        # Package tracking
```

## Request Format

### Headers

```http
Content-Type: application/json
Accept: application/json
```

### Query Parameters

Common query parameters across endpoints:

- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)
- `search` - Search term
- `status` - Filter by status
- `sort` - Sort field
- `order` - Sort order (asc/desc)

Example:
```
GET /api/management/students?limit=25&offset=50&search=John
```

### Request Body

JSON format:
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

## Response Format

### Success Response

```json
{
  "data": {...},
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

Or for single resources:
```json
{
  "id": "123",
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `500 Internal Server Error` - Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Anonymous users**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Validation

All endpoints validate input data using Zod schemas. Validation errors return:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    },
    {
      "path": ["password"],
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Pagination

Endpoints returning lists support pagination:

```
GET /api/management/students?limit=25&offset=50
```

Response includes pagination metadata:
```json
{
  "students": [...],
  "total": 150,
  "limit": 25,
  "offset": 50
}
```

Calculate total pages:
```javascript
const totalPages = Math.ceil(total / limit);
const currentPage = Math.floor(offset / limit) + 1;
```

## Filtering

Most list endpoints support filtering:

```
GET /api/management/properties?city=Cape+Town&nsfasApproved=true
```

Common filters:
- `status` - Filter by status
- `search` - Full-text search
- Entity-specific filters (see individual endpoint docs)

## Sorting

Sort results using `sort` and `order` parameters:

```
GET /api/management/students?sort=lastName&order=asc
```

Default sort order is usually by creation date descending.

## Audit Logging

All API operations are logged for audit purposes:

- User ID and role
- Action performed (CREATE, READ, UPDATE, DELETE)
- Resource type and ID
- Timestamp
- Success/failure status
- IP address (in production)

Audit logs comply with ISO 27001 and SOC 2 requirements.

## Examples

### Get All Properties

```bash
curl -X GET http://localhost:3000/api/management/properties \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"
```

### Create a Maintenance Request

```bash
curl -X POST http://localhost:3000/api/student/maintenance-requests \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "category": "plumbing",
    "title": "Leaking faucet",
    "description": "The bathroom faucet is leaking",
    "urgency": "medium",
    "location": "Room 205, Bathroom"
  }'
```

### Update Student Information

```bash
curl -X PUT http://localhost:3000/api/management/students/123 \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27123456789",
    "emergencyContactPhone": "+27987654321"
  }'
```

## Next Steps

Explore specific API documentation:

- [Authentication API](authentication.md)
- [Management APIs](management/properties.md)
- [Student APIs](student/accommodation.md)

## SDK and Client Libraries

Official client libraries are coming soon for:
- JavaScript/TypeScript
- Python
- Java

For now, use standard HTTP clients like:
- `fetch` (built-in)
- `axios`
- `curl`

## Support

- 📖 **API Documentation**: You're reading it!
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/your-org/student-accommodation/issues)
- 💬 **Ask Questions**: [GitHub Discussions](https://github.com/your-org/student-accommodation/discussions)
