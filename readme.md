# Sensible Server API

This is a Node.js Express server application that provides user authentication, patient-caretaker relationship management, and push notification functionality. The server uses Prisma as an ORM with MongoDB, JWT-based authentication, and Firebase Cloud Messaging for push notifications.

## Project Structure

The API is divided into two main route groups:
- **User Authentication & Management** (`/api/auth`) - Handles user operations and relationships
- **Push Notifications** (`/api/notification`) - Handles Firebase Cloud Messaging operations

## Technologies Used

- **Express.js v5.1.0** - Web framework
- **Prisma v6.9.0** - Database ORM with MongoDB
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Firebase Admin SDK** - Push notifications via FCM
- **cookie-parser** - Cookie handling
- **dotenv** - Environment variable management
- **nodemon** - Development server with auto-restart

## Database Schema

### User Model
```prisma
model User {
  id         String         @id @default(auto()) @map("_id") @db.ObjectId
  email      String         @unique
  password   String
  name       String
  token      String?        // FCM token for push notifications
  isPatient  Boolean        @default(false)
  patients   UserRelation[] @relation("CaretakerLink")
  caretakers UserRelation[] @relation("PatientLink")
}
```

### UserRelation Model
```prisma
model UserRelation {
  id          String @id @default(auto()) @map("_id") @db.ObjectId
  patientId   String @db.ObjectId
  caretakerId String @db.ObjectId
  patient     User   @relation("PatientLink", fields: [patientId], references: [id])
  caretaker   User   @relation("CaretakerLink", fields: [caretakerId], references: [id])
  
  @@unique([patientId, caretakerId])
}
```

## API Routes Documentation

### Authentication & User Management Routes
**Base URL:** `{serverURL}/api/auth`

#### 1. User Sign Up
- **Endpoint:** `POST /signup`
- **Description:** Creates a new user account
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string", 
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "userToken": "jwt_token_string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "token": null,
      "isPatient": false
    }
  }
  ```
- **Notes:** Password is automatically hashed using bcrypt

#### 2. User Login
- **Endpoint:** `POST /login`
- **Description:** Authenticates existing user
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "userToken": "jwt_token_string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "token": "fcm_token_if_exists",
      "isPatient": boolean
    }
  }
  ```
- **Error Codes:** 
  - 403: Invalid credentials

#### 3. Get User Info
- **Endpoint:** `GET /userinfo`
- **Description:** Retrieves user information using Bearer token authentication
- **Headers:**
  ```
  Authorization: Bearer {jwt_token}
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "name": "string", 
      "email": "string",
      "token": "fcm_token_if_exists"
    }
  }
  ```
- **Error Codes:**
  - 401: Unauthorized (missing or invalid Bearer token)

#### 4. Get User Info by User ID
- **Endpoint:** `GET /userinfoById`
- **Description:** Retrieves user information using user ID
- **Request Body:**
  ```json
  {
    "userId": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "name": "string", 
      "email": "string",
      "token": "fcm_token_if_exists"
    }
  }
  ```

### Patient-Caretaker Relationship Routes

#### 5. Add Patient
- **Endpoint:** `POST /addpatient`
- **Description:** Allows a caretaker to add a patient to their care list
- **Request Body:**
  ```json
  {
    "userToken": "caretaker_jwt_token",
    "patientId": "patient_user_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relation": {
      "id": "relation_id",
      "caretakerId": "string",
      "patientId": "string"
    }
  }
  ```
- **Notes:** 
  - Sets the patient's `isPatient` flag to `true`
  - Creates unique relationship (prevents duplicates)

#### 6. Add Caretaker
- **Endpoint:** `POST /addcaretaker`
- **Description:** Allows a patient to add a caretaker to their care team
- **Request Body:**
  ```json
  {
    "userToken": "patient_jwt_token",
    "caretakerId": "caretaker_user_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relation": {
      "id": "relation_id",
      "caretakerId": "string",
      "patientId": "string"
    }
  }
  ```
- **Notes:** 
  - Sets the patient's `isPatient` flag to `true`
  - Creates unique relationship (prevents duplicates)

#### 7. Get Patients
- **Endpoint:** `GET /getpatients`
- **Description:** Retrieves all patients associated with a caretaker
- **Headers:**
  ```
  Authorization: Bearer {caretaker_jwt_token}
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relations": [
      {
        "id": "relation_id",
        "caretakerId": "string",
        "patientId": "string",
        "patient": {
          "id": "string",
          "name": "string",
          "email": "string",
          "token": "fcm_token_if_exists",
          "isPatient": true
        }
      }
    ]
  }
  ```

#### 8. Get Caretakers
- **Endpoint:** `GET /getcaretakers`
- **Description:** Retrieves all caretakers associated with a patient
- **Headers:**
  ```
  Authorization: Bearer {patient_jwt_token}
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relations": [
      {
        "id": "relation_id", 
        "caretakerId": "string",
        "patientId": "string",
        "caretaker": {
          "id": "string",
          "name": "string",
          "email": "string",
          "token": "fcm_token_if_exists",
          "isPatient": false
        }
      }
    ]
  }
  ```

#### 9. Remove Patient
- **Endpoint:** `DELETE /removepatient`
- **Description:** Removes a patient from a caretaker's care list
- **Request Body:**
  ```json
  {
    "userToken": "caretaker_jwt_token",
    "patientId": "patient_user_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Patient {patient_name} removed successfully"
  }
  ```

#### 10. Remove Caretaker
- **Endpoint:** `DELETE /removecaretaker`
- **Description:** Removes a caretaker from a patient's care team
- **Request Body:**
  ```json
  {
    "userToken": "patient_jwt_token",
    "caretakerId": "caretaker_user_id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Caretaker {caretaker_name} removed successfully"
  }
  ```

---

### Push Notification Routes
**Base URL:** `{serverURL}/api/notification`

#### 11. Set FCM Token
- **Endpoint:** `PUT /token`
- **Description:** Updates user's FCM token for push notifications
- **Request Body:**
  ```json
  {
    "userToken": "jwt_token",
    "token": "fcm_device_token"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Token updated successfully"
  }
  ```

#### 12. Get FCM Token
- **Endpoint:** `GET /token`
- **Description:** Retrieves user's FCM token
- **Headers:**
  ```
  Authorization: Bearer {jwt_token}
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "fcm_device_token",
    "message": "Token retrieved successfully"
  }
  ```

#### 13. Remove FCM Token
- **Endpoint:** `DELETE /token`
- **Description:** Removes user's FCM token (for logout/unsubscribe)
- **Request Body:**
  ```json
  {
    "userToken": "jwt_token"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Token removed successfully"
  }
  ```

#### 14. Send Notification to User
- **Endpoint:** `POST /sendtouser`
- **Description:** Sends push notification to a specific user
- **Request Body:**
  ```json
  {
    "userToken": "sender_jwt_token",
    "recieverId": "recipient_user_id",
    "title": "Notification Title",
    "body": "Notification message body"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "response": "firebase_response_object"
  }
  ```
- **Error Responses:**
  ```json
  {
    "error": "User has no FCM token"
  }
  ```

#### 15. Send Notification to Patient's Caretakers
- **Endpoint:** `POST /sendtogroupfrompatients`
- **Description:** Sends push notification to all caretakers of a patient
- **Request Body:**
  ```json
  {
    "userToken": "patient_jwt_token",
    "title": "Emergency Alert",
    "body": "Patient needs assistance"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "response": "firebase_multicast_response"
  }
  ```
- **Special Cases:**
  ```json
  {
    "success": false,
    "message": "No valid caretaker tokens found."
  }
  ```

#### 16. Send Notification to All Users
- **Endpoint:** `POST /sendtoallusers`
- **Description:** Sends push notification to all users with FCM tokens (admin broadcast)
- **Request Body:**
  ```json
  {
    "userToken": "admin_jwt_token",
    "title": "System Announcement",
    "body": "Important system update message"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Notifications sent to all users."
  }
  ```
- **Notes:** 
  - Sends notifications in batches of 500 for performance
  - Only sends to users with valid FCM tokens

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with two methods:

### 1. Bearer Token Authentication (Recommended)
Used in GET endpoints and some notification endpoints:
```
Headers: Authorization: Bearer {jwt_token}
```

### 2. Request Body Token
Used in POST/PUT/DELETE endpoints:
```json
{
  "userToken": "jwt_token",
  // ... other fields
}
```

## Error Handling

All routes include comprehensive error handling:

- **200:** Success
- **401:** Unauthorized (missing/invalid Bearer token)
- **403:** Forbidden (invalid credentials)
- **500:** Server errors (validation failures, database errors, etc.)

Error response format:
```json
{
  "error": "Error message description"
}
```

## Firebase Cloud Messaging Setup

The application uses Firebase Admin SDK for push notifications:

1. **Service Account:** Configured via `SERVICE_ACCOUNT_PATH` environment variable
2. **Token Management:** FCM tokens stored in User model
3. **Notification Types:**
   - Direct user notifications
   - Group notifications (patient to caretakers)
   - Broadcast notifications (admin to all users)

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=3000
JWT_SECRET=your_secure_jwt_secret
SERVICE_ACCOUNT_PATH=./config/service_account_file.json
```

## Database Relations

The application manages user relationships through the `UserRelation` model:

- **Many-to-Many Relationship:** Patients ↔ Caretakers
- **Unique Constraints:** Prevents duplicate relationships
- **Cascade Operations:** Relationship management with proper validation

### Relationship Rules:
- One caretaker can have multiple patients
- One patient can have multiple caretakers  
- Relationships are bidirectional (can be created from either side)
- Unique constraint prevents duplicate relationships

## Setup and Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your database connection and secrets

3. **Setup Firebase:**
   - Download service account key from Firebase Console
   - Place in `config/service_account_file.json`

4. **Initialize database:**
   ```bash
   npx prisma db push
   ```

5. **Run in development:**
   ```bash
   npm run dev
   ```

## File Structure Overview

```
├── controllers/
│   ├── userControllers.js      # User auth & relationship logic
│   └── notificationControllers.js # FCM notification logic
├── routes/
│   ├── userRoutes.js          # User API endpoints
│   └── notificationRoutes.js  # Notification API endpoints  
├── utils/
│   └── cookieToken.js         # JWT token utilities
├── helpers/
│   └── getJwtToken.js         # JWT token generation
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── index.js              # Prisma client setup
├── config/
│   └── service_account_file.json # Firebase service account
├── index.js                   # Main server file
└── .env                      # Environment variables
```

## API Testing

You can test the API endpoints using tools like Postman or curl. Make sure to:

1. **Sign up/Login** first to get JWT tokens
2. **Set FCM tokens** for notification testing
3. **Create relationships** between users for group notifications
4. **Use proper authentication** headers or request body tokens

## Production Considerations

- **Environment Variables:** Ensure all secrets are properly configured
- **Database:** Use MongoDB Atlas or similar managed service
- **Firebase:** Configure proper Firebase project with FCM enabled
- **Security:** Implement rate limiting and input validation
- **Monitoring:** Add logging and error tracking
- **HTTPS:** Use SSL/TLS in production