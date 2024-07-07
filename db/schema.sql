-- Drop database if it exists (be careful with this in production)
DROP DATABASE IF EXISTS employeetracker_db;

-- Create the database
CREATE DATABASE employeetracker_db;

-- Connect to the database
\c employeetracker_db;

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL
);

-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    salary DECIMAL(10,2),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create employee table
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT,
    manager_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
);