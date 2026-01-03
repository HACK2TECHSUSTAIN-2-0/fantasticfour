---
title: Fantastic Four Backend
emoji: 🛡️
colorFrom: blue
colorTo: red
sdk: docker
pinned: false
app_port: 7860
---

# Backend Server

This is the FastAPI backend for the Fantastic Four application.

## Setup

1.  **Install Dependencies**:
    Navigate to the `backend` folder and run:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Database**:
    Ensure you have PostgreSQL running and a database named `fantasticfour` exists.
    The connection string is configured as: `postgresql://postgres:postgres@localhost:5432/fantasticfour`

3.  **Run Server**:
    From the `backend` directory, run:
    ```bash
    uvicorn app.main:app --reload
    ```
    The server will start at `http://127.0.0.1:8000`.

## Features
-   **Security**: Passwords are hashed using bcrypt.
-   **Default Admin**: On first run, a default admin account is created:
    -   Email: `shivaranjaneravishankar@gmail.com`
    -   Password: `123`
-   **API Documentation**: Visit `http://127.0.0.1:8000/docs` for the interactive Swagger UI.
