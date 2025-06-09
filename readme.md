# Sensible Server API

This is a Node.js Express server application that provides user authentication and patient-caretaker relationship management functionality. The server uses Prisma as an ORM with JWT-based authentication.

## Project Structure

The main API routes are defined in `routes/userRoutes.js`, which handles all user-related operations including authentication, token management, and patient-caretaker relationships.

## Technologies Used

- **Express.js** - Web framework
- **Prisma** - Database ORM
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **cookie-parser** - Cookie handling

## API Routes Documentation

All routes are prefixed with the base URL of your server backendURL+'/api/auth' . The following routes are available:

### Authentication Routes

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
- **Response:** Returns user data with authentication cookie
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
- **Response:** Returns user data with authentication cookie
- **Error Codes:** 
  - 403: Invalid credentials

### User Information Routes

#### 3. Get User Info
- **Endpoint:** `GET /userinfo`
- **Description:** Retrieves user information using JWT token
- **Request Body:**
  ```json
  {
    "userToken": "string"
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
      "token": "string"
    }
  }
  ```

### Token Management Routes

#### 4. Set Token
- **Endpoint:** `PUT /settoken`
- **Description:** Updates user's token (likely for push notifications)
- **Request Body:**
  ```json
  {
    "userToken": "string",
    "token": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Token updated successfully"
  }
  ```
#### 4. Get Token
- **Endpoint:** `POST /gettoken`
- **Description:** Updates user's token (likely for push notifications)
- **Request Body:**
  ```json
  {
    "userToken": "string",
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": token
  }
  ```

#### 5. Remove Token
- **Endpoint:** `DELETE /removetoken`
- **Description:** Removes user's token
- **Request Body:**
  ```json
  {
    "userToken": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Token removed successfully"
  }
  ```

### Patient-Caretaker Relationship Routes

#### 6. Add Patient
- **Endpoint:** `POST /addpatient`
- **Description:** Allows a caretaker to add a patient to their care list
- **Request Body:**
  ```json
  {
    "userToken": "string",
    "patientId": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relation": {
      "caretakerId": "string",
      "patientId": "string"
    }
  }
  ```
- **Notes:** The userToken should belong to the caretaker

#### 7. Add Caretaker
- **Endpoint:** `POST /addcaretaker`
- **Description:** Allows a patient to add a caretaker to their care team
- **Request Body:**
  ```json
  {
    "userToken": "string",
    "caretakerId": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relation": {
      "caretakerId": "string",
      "patientId": "string"
    }
  }
  ```
- **Notes:** The userToken should belong to the patient

#### 8. Get Patients
- **Endpoint:** `GET /getpatients`
- **Description:** Retrieves all patients associated with a caretaker
- **Request Body:**
  ```json
  {
    "userToken": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relations": [
      {
        "caretakerId": "string",
        "patientId": "string",
        "patient": {
          "id": "string",
          "name": "string",
          "email": "string"
        }
      }
    ]
  }
  ```

#### 9. Get Caretakers
- **Endpoint:** `GET /getcaretakers`
- **Description:** Retrieves all caretakers associated with a patient
- **Request Body:**
  ```json
  {
    "userToken": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "relations": [
      {
        "caretakerId": "string",
        "patientId": "string",
        "caretaker": {
          "id": "string",
          "name": "string",
          "email": "string"
        }
      }
    ]
  }
  ```

#### 10. Remove Patient
- **Endpoint:** `DELETE /removepatient`
- **Description:** Removes a patient from a caretaker's care list
- **Request Body:**
  ```json
  {
    "userToken": "string",
    "patientId": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Patient [name] removed successfully"
  }
  ```
- **Notes:** The userToken should belong to the caretaker

#### 11. Remove Caretaker
- **Endpoint:** `DELETE /removecaretaker`
- **Description:** Removes a caretaker from a patient's care team
- **Request Body:**
  ```json
  {
    "userToken": "string",
    "caretakerId": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Caretaker [name] removed successfully"
  }
  ```
- **Notes:** The userToken should belong to the patient

## Error Handling

All routes include error handling that returns appropriate HTTP status codes:
- **200:** Success
- **403:** Invalid credentials (login)
- **500:** Server errors (validation failures, database errors, etc.)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are:
- Generated during signup and login
- Stored in HTTP cookies via the `cookieToken` utility
- Required for all protected routes
- Verified using the `JWT_SECRET` environment variable

## Database Relations

The application manages a `UserRelation` model that connects:
- **Caretakers:** Users who provide care
- **Patients:** Users who receive care

This many-to-many relationship allows:
- One caretaker to have multiple patients
- One patient to have multiple caretakers

## Setup and Running

1. Install dependencies: `npm install`
2. Set up your database and Prisma schema
3. Configure environment variables (JWT_SECRET, database connection)
4. Run in development: `npm run dev`

## File Structure Overview

- `routes/userRoutes.js` - Defines all API endpoints
- `controllers/userControllers.js` - Contains business logic for each route
- `utils/cookieToken.js` - Handles JWT token creation and cookie setting
- `prisma/` - Database schema and configuration