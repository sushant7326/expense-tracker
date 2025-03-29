# API Documentation

## Base URL

```
http://localhost:<BE_PORT> 
<BE_PORT> = 5000 (default)
```

## Authentication

All endpoints except `/auth/register` and `/auth/login` require a valid JWT token in the Authorization header.

## Data Types

- UUID: Universally Unique Identifier (e.g., 123e4567-e89b-12d3-a456-426614174000)
- TIMESTAMP WITH TIME ZONE: ISO 8601 timestamp (e.g., 2023-10-15T12:00:00Z)

## Endpoints

### Authentication

#### Register a new user

- **URL**: `/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string (max 255 chars, unique)",
    "password": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "UUID",
      "username": "string",
      "password_hash": "string",
      "created_at": "TIMESTAMP"
    }
  }
  ```
- **Error Responses**:
  - `400`: User already exists
  - `500`: Failed to create user or hash password

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "string",
    "user_id": "UUID"
  }
  ```
- **Error Responses**:
  - `401`: Invalid username or password
  - `500`: Error in comparing hashed password or running query

#### Change password

- **URL**: `/auth/change-password`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "new_password": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Password updated successfully"
  }
  ```
- **Error Responses**:
  - `500`: Error hashing new password or updating database

#### Delete user

- **URL**: `/auth/delete-user`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "password": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "User <user_id> deleted successfully"
  }
  ```
- **Error Responses**:
  - `401`: Invalid password
  - `500`: Error comparing password, fetching from database, or deleting user

### Users

#### Get all users

- **URL**: `/users`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "user_id": "number",
        "username": "string",
        "password_hash": "string"
      }
    ]
  }
  ```
- **Error Response**:
  - `500`: Failed to list users

#### Get user by ID

- **URL**: `/users/:id`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "UUID",
      "username": "string",
      "password_hash": "string",
      "created_at": "TIMESTAMP"
    }
  }
  ```
- **Error Responses**:
  - `404`: User not found
  - `500`: Failed to list user

### Transactions

#### Get all transactions for user

- **URL**: `/transactions`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": [
      {
        "transaction_id": "UUID",
        "user_id": "UUID",
        "amount": "integer (>0)",
        "expense": "boolean",
        "title": "string (max 100 chars)",
        "description": "string",
        "category": "string (max 50 chars)",
        "payment_method": "string (max 30 chars)",
        "location": "string (max 100 chars)",
        "transaction_time": "TIMESTAMP WITH TIMEZONE",
        "created_at": "TIMESTAMP WITH TIMEZONE",
        "updated_at": "TIMESTAMP WITH TIMEZONE"
      }
    ]
  }
  ```
- **Error Response**:
  - `500`: Error making database query

#### Get all expenses for user (expense: true)

- **URL**: `/transactions/expense`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": [
      {
        "transaction_id": "UUID",
        "user_id": "UUID",
        "amount": "integer (>0)",
        "expense": "boolean",
        "title": "string (max 100 chars)",
        "description": "string",
        "category": "string (max 50 chars)",
        "payment_method": "string (max 30 chars)",
        "location": "string (max 100 chars)",
        "transaction_time": "TIMESTAMP WITH TIMEZONE",
        "created_at": "TIMESTAMP WITH TIMEZONE",
        "updated_at": "TIMESTAMP WITH TIMEZONE"
      }
    ]
  }
  ```
- **Error Response**:
  - `500`: Error making database query

#### Get all incomes for user (expense: false)

- **URL**: `/transactions`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": [
      {
        "transaction_id": "UUID",
        "user_id": "UUID",
        "amount": "integer (>0)",
        "expense": "boolean",
        "title": "string (max 100 chars)",
        "description": "string",
        "category": "string (max 50 chars)",
        "payment_method": "string (max 30 chars)",
        "location": "string (max 100 chars)",
        "transaction_time": "TIMESTAMP WITH TIMEZONE",
        "created_at": "TIMESTAMP WITH TIMEZONE",
        "updated_at": "TIMESTAMP WITH TIMEZONE"
      }
    ]
  }
  ```
- **Error Response**:
  - `500`: Error making database query

#### Add a transaction

- **URL**: `/transactions/add`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "amount": "number",
    "expense": "boolean",
    "title": "string",
    "description": "string",
    "category": "string",
    "payment_method": "string",
    "location": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Transaction added successfully"
  }
  ```
- **Error Response**:
  - `500`: Error making database query

#### Update a transaction

- **URL**: `/transactions/update-transaction/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "amount": "number",
    "expense": "boolean",
    "title": "string",
    "description": "string",
    "category": "string",
    "payment_method": "string",
    "location": "string"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Transaction updated successfully"
  }
  ```
- **Error Response**:
  - `500`: Error making database query

#### Delete a transaction

- **URL**: `/transactions/delete`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "transaction_id": "UUID"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Transaction deleted successfully"
  }
  ```
- **Error Response**:
  - `500`: Error making database query

## Error Handling

All endpoints return a 500 status code with an error message if something goes wrong on the server side.

Example error response:

```json
{
  "error": "Error message"
}
```
