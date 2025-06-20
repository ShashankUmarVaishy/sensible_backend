nodemon# Sensible Server API

This is a Node.js Express server application that provides user authentication, patient-caretaker relationship management, and push notification functionality. The server uses Prisma as an ORM with MongoDB, JWT-based authentication, and Firebase Cloud Messaging for push notifications.

## Project Structure

The API is divided into two main route groups:
- **User Authentication & Management** (`/api/auth`) - Handles user operations and relationships
- **Push Notifications** (`/api/notification`) - Handles Firebase Cloud Messaging operations

## Technologies Used

- **Express.js v5.1.0** - Web framework
- **Prisma v6.9.0** - Database ORM with MongoDB
- **JWT (jsonwebtoken v9.0.2)** - Authentication tokens
- **bcryptjs v3.0.2** - Password hashing
- **Firebase Admin SDK v13.4.0** - Push notifications via FCM
- **Firebase v11.9.1** - Firebase client SDK
- **cookie-parser v1.4.7** - Cookie handling
- **dotenv v16.5.0** - Environment variable management
- **nodemon v3.1.10** - Development server with auto-restart
- **expo-server-sdk v3.15.0** - Expo push notifications support
- **google-auth-library v10.1.0** - Google authentication utilities

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

#### 5. Update Profile
- **Endpoint:** `PUT /updateprofile`
- **Description:** Updates user profile information (age and phone number)
- **Request Body:**
  ```json
  {
    "userToken": "jwt_token",
    "age": "number",
    "phoneNumber": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully"
  }
  ```
- **Notes:** Updates the user's age and phone number fields

### Patient-Caretaker Relationship Routes

#### 6. Add Patient by Email
- **Endpoint:** `POST /addpatientbyemail`
- **Description:** Allows a caretaker to add a patient to their care list using patient's email
- **Request Body:**
  ```json
  {
    "userToken": "caretaker_jwt_token",
    "patientEmail": "patient_email@example.com"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "patient added successfully"
  }
  ```
- **Notes:** 
  - Sets the patient's `isPatient` flag to `true`
  - Creates unique relationship (prevents duplicates)

#### 7. Add Caretaker by Email
- **Endpoint:** `POST /addcaretakerbyemail`
- **Description:** Allows a patient to add a caretaker to their care team using caretaker's email
- **Request Body:**
  ```json
  {
    "userToken": "patient_jwt_token",
    "caretakerEmail": "caretaker_email@example.com"
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

#### 8. Add Patient
- **Endpoint:** `POST /addpatient`
- **Description:** Allows a caretaker to add a patient to their care list using patient's ID
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

#### 9. Add Caretaker
- **Endpoint:** `POST /addcaretaker`
- **Description:** Allows a patient to add a caretaker to their care team using caretaker's ID
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

#### 10. Get Patients
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

#### 11. Get Caretakers
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

#### 12. Remove Patient
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

#### 13. Remove Caretaker
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

#### 14. Set FCM Token
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

#### 15. Get FCM Token
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

#### 16. Remove FCM Token
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

#### 17. Send Notification to User
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

#### 18. Send Notification to Patient's Caretakers
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

#### 19. Send Notification to All Users
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

## Database Schema

The application uses MongoDB with Prisma ORM and includes the following models:

### User Model
- **id:** Unique identifier (ObjectId)
- **email:** Unique email address
- **password:** Hashed password using bcrypt
- **name:** User's full name
- **token:** FCM token for push notifications (optional)
- **age:** User's age (optional, default: 0)
- **phoneNumber:** User's phone number (optional, default: "")
- **isPatient:** Boolean flag indicating if user is a patient (default: false)

### UserRelation Model
- **id:** Unique identifier (ObjectId)
- **patientId:** Reference to patient User
- **caretakerId:** Reference to caretaker User
- **Unique constraint:** Prevents duplicate relationships between same patient-caretaker pair

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
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL="your_mongodb_connection_string"
   JWT_SECRET="your_jwt_secret_key"
   SERVICE_ACCOUNT_PATH="./config/firebase_service_account_key.json"
   ```

3. **Setup Firebase:**
   - Download service account key from Firebase Console
   - Place in `config/firebase_service_account_key.json`

4. **Initialize database:**
   ```bash
   npx prisma db push
   ```

5. **Run in development:**
   ```bash
   npm run dev
   ```

6. **Run in production:**
   ```bash
   node index.js
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
│   └── firebase_service_account_key.json # Firebase service account
├── index.js                   # Main server file
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables
```

## API Testing

You can test the API endpoints using tools like Postman or curl. Make sure to:

1. **Sign up/Login** first to get JWT tokens
2. **Set FCM tokens** for notification testing
3. **Create relationships** between users for group notifications
4. **Use proper authentication** headers or request body tokens

### Example API Calls

#### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

#### Add Patient by Email
```bash
curl -X POST http://localhost:3000/api/auth/addpatientbyemail \
  -H "Content-Type: application/json" \
  -d '{"userToken":"your_jwt_token","patientEmail":"patient@example.com"}'
```

## Production Considerations

- **Environment Variables:** Ensure all secrets are properly configured
- **Database:** Use MongoDB Atlas or similar managed service
- **Firebase:** Configure proper Firebase project with FCM enabled
- **Security:** Implement rate limiting and input validation
- **Monitoring:** Add logging and error tracking
- **HTTPS:** Use SSL/TLS in production
- **CORS:** Configure CORS settings for your frontend domains
- **Error Logging:** Implement comprehensive error logging and monitoring

## Version History

- **v1.0.0:** Initial release with user authentication, patient-caretaker relationships, and push notifications
- Added support for email-based user relationships
- Added user profile updates (age and phone number)
- Updated dependencies to latest versions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License