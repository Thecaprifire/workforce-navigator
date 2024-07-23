require('dotenv').config(); // Load environment variables from .env file

// Import necessary modules
const { Client } = require("pg"); // PostgreSQL database connection
const inquirer = require("inquirer"); // For user prompts
const cfonts = require('cfonts'); // Styling console output
const util = require('util'); // Import the util module

// Create a PostgreSQL connection configuration
const connection = new Client({
    host: "localhost", // PostgreSQL server host
    user: process.env.PG_USER, // PostgreSQL username
    password: process.env.PG_PASSWORD, // PostgreSQL password
    database: "employeetracker_db", // Database name
    port: 5432,               // PostgreSQL server port 
});

// Connect to the database
connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to the database!"); // Successful connection message
    // Start the application
    start();
});
// Function to style and display application title
cfonts.say('Employee \nTracker', {
    font: 'block',              // Font face for the title
    align: 'left',              // Alignment of the text
    colors: ['red'],         // Color of the text
    background: 'transparent',  // Background color
    letterSpacing: 1,           // Letter spacing
    lineHeight: 1,              // Line height
    space: true,                // Empty lines on top and bottom
    maxLength: '0',             // Maximum characters per line
    gradient: false,            // Gradient colors
    independentGradient: false, // Separate gradients for each line
    transitionGradient: false,  // Color transition effect
    env: 'node'                 // Environment where cfonts runs
});

// Function to start the application
async function start() {
    try {
        const answer = await inquirer.prompt({
            type: "list",
            name: "action",
            message: "What would you like to do?", // User prompt message
            choices: [
                "View all Departments",
                "View all Roles",
                "View all Employees",
                "Add a Department",
                "Add a Role",
                "Add an Employee",
                "Add a Manager",
                "Update an Employee Role",
                "View Employees by Manager",
                "View Employees by Department",
                "Delete Departments | Roles | Employees",
                "View the total utilized budget of a department",
                "Exit",
            ],
        });

        switch (answer.action) {
            case "View all Departments":
                await viewAllDepartments();
                break;
            case "View all Roles":
                await viewAllRoles();
                break;
            case "View all Employees":
                await viewAllEmployees();
                break;
            case "Add a Department":
                await addDepartment();
                break;
            case "Add a Role":
                await addRole();
                break;
            case "Add an Employee":
                await addEmployee();
                break;
            case "Add a Manager":
                await addManager();
                break;
            case "Update an Employee Role":
                await updateEmployeeRole();
                break;
            case "View Employees by Manager":
                await viewEmployeesByManager();
                break;
            case "View Employees by Department":
                await viewEmployeesByDepartment();
                break;
            case "Delete Departments | Roles | Employees":
                await deleteDepartmentsRolesEmployees();
                break;
            case "View the total utilized budget of a department":
                await viewTotalUtilizedBudgetOfDepartment();
                break;
            case "Exit":
                connection.end(); // Close database connection
                console.log("Goodbye!"); // Exit message
                break;
        }
    } catch (error) {
        console.error("Error starting the application:", error);
    }
}

// Function to view all departments
async function viewAllDepartments() {
    try {
        const query = "SELECT * FROM departments"; // SQL query to select all departments
        const res = await connection.query(query);
        console.table(res.rows); // Display departments in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to view all roles
async function viewAllRoles() {
    try {
        const query = "SELECT roles.title, roles.id, departments.department_name, roles.salary from roles join departments on roles.department_id = departments.id"; // SQL query to select roles with department details
        const res = await connection.query(query);
        console.table(res.rows); // Display roles in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to view all employees
async function viewAllEmployees() {
    try {
        const query = `
            SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
            FROM employee e
            LEFT JOIN roles r ON e.role_id = r.id
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN employee m ON e.manager_id = m.id;
        `; // SQL query to select all employees with detailed information
        const res = await connection.query(query);
        console.table(res.rows); // Display employees in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to add a department
async function addDepartment() {
    try {
        const answer = await inquirer.prompt({
            type: "input",
            name: "name",
            message: "Enter the name of the new department:", // Prompt user for department name
        });
        console.log(answer.name); // Log the department name entered
        const query = `INSERT INTO departments (department_name) VALUES ($1)`; // SQL query to insert a new department
        await connection.query(query, [answer.name]);
        console.log(`Added department ${answer.name} to the database!`); // Confirmation message for adding department
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to add a role
async function addRole() {
    try {
        const departmentsQuery = "SELECT * FROM departments"; // SQL query to select all departments
        const res = await connection.query(departmentsQuery);
        const departments = res.rows.map((department) => department.department_name);

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter the title of the new role:", // Prompt user for role title
            },
            {
                type: "input",
                name: "salary",
                message: "Enter the salary of the new role:", // Prompt user for role salary
            },
            {
                type: "list",
                name: "department",
                message: "Select the department for the new role:", // Prompt user to select department for the new role
                choices: departments,
            },
        ]);

        const departmentId = res.rows.find((dept) => dept.department_name === answers.department).id;

        const query = "INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)";
        await connection.query(query, [answers.title, answers.salary, departmentId]);
        console.log(
            `Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database!`
        ); // Confirmation message for adding role
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to add an employee
async function addEmployee() {
    try {
        const roleResults = await connection.query("SELECT id, title FROM roles");
        const roles = roleResults.rows.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        const employeeResults = await connection.query(
            'SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee'
        );
        const managers = employeeResults.rows.map(({ id, name }) => ({
            name,
            value: id,
        }));

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "firstName",
                message: "Enter the employee's first name:",
            },
            {
                type: "input",
                name: "lastName",
                message: "Enter the employee's last name:",
            },
            {
                type: "list",
                name: "roleId",
                message: "Select the employee role:",
                choices: roles,
            },
            {
                type: "list",
                name: "managerId",
                message: "Select the employee manager:",
                choices: [
                    { name: "None", value: null },
                    ...managers,
                ],
            },
        ]);

        const sql = "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)";
        const values = [
            answers.firstName,
            answers.lastName,
            answers.roleId,
            answers.managerId,
        ];
        await connection.query(sql, values);
        console.log(`Added ${answers.firstName} ${answers.lastName} to the database!`);
        start(); // Restart the application
    } catch (error) {
        console.error(error);
    }
}

// Function to add a manager to an employee
async function addManager() {
    try {
        const employeeResults = await connection.query(
            'SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee'
        );
        const employees = employeeResults.rows.map(({ id, name }) => ({
            name,
            value: id,
        }));

        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Select the employee to assign a manager:",
                choices: employees,
            },
            {
                type: "list",
                name: "managerId",
                message: "Select the manager:",
                choices: [
                    { name: "None", value: null },
                    ...employees,
                ],
            },
        ]);

        const sql = "UPDATE employee SET manager_id = $1 WHERE id = $2";
        const values = [answers.managerId, answers.employeeId];
        await connection.query(sql, values);
        console.log(`Assigned manager to employee!`);
        start(); // Restart the application
    } catch (error) {
        console.error(error);
    }
}

// Function to update an employee role
async function updateEmployeeRole() {
    try {
        const employeeResults = await connection.query(
            'SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee'
        );
        const employees = employeeResults.rows.map(({ id, name }) => ({
            name,
            value: id,
        }));

        const roleResults = await connection.query("SELECT id, title FROM roles");
        const roles = roleResults.rows.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Select the employee to update:",
                choices: employees,
            },
            {
                type: "list",
                name: "roleId",
                message: "Select the new role:",
                choices: roles,
            },
        ]);

        const sql = "UPDATE employee SET role_id = $1 WHERE id = $2";
        const values = [answers.roleId, answers.employeeId];
        await connection.query(sql, values);
        console.log(`Updated employee's role!`);
        start(); // Restart the application
    } catch (error) {
        console.error(error);
    }
}

// Function to view employees by manager
async function viewEmployeesByManager() {
    try {
        const query = `
            SELECT 
                CONCAT(m.first_name, ' ', m.last_name) AS manager_name, 
                e.id, 
                e.first_name, 
                e.last_name, 
                r.title, 
                d.department_name, 
                r.salary
            FROM 
                employee e
                LEFT JOIN roles r ON e.role_id = r.id
                LEFT JOIN departments d ON r.department_id = d.id
                LEFT JOIN employee m ON e.manager_id = m.id
            ORDER BY 
                manager_name;
        `; // SQL query to select employees grouped by manager
        const res = await connection.query(query);
        console.table(res.rows); // Display employees in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to view employees by department
async function viewEmployeesByDepartment() {
    try {
        const query = `
            SELECT 
                d.department_name, 
                e.id, 
                e.first_name, 
                e.last_name, 
                r.title, 
                r.salary, 
                CONCAT(m.first_name, ' ', m.last_name) AS manager_name
            FROM 
                employee e
                LEFT JOIN roles r ON e.role_id = r.id
                LEFT JOIN departments d ON r.department_id = d.id
                LEFT JOIN employee m ON e.manager_id = m.id
            ORDER BY 
                d.department_name;
        `; // SQL query to select employees grouped by department
        const res = await connection.query(query);
        console.table(res.rows); // Display employees in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to delete departments, roles, or employees
async function deleteDepartmentsRolesEmployees() {
    try {
        const answer = await inquirer.prompt({
            type: "list",
            name: "deleteChoice",
            message: "What would you like to delete?",
            choices: ["Department", "Role", "Employee"],
        });

        switch (answer.deleteChoice) {
            case "Department":
                await deleteDepartment();
                break;
            case "Role":
                await deleteRole();
                break;
            case "Employee":
                await deleteEmployee();
                break;
        }
    } catch (error) {
        console.error(error);
    }
}

// Function to delete a department
async function deleteDepartment() {
    try {
        const query = "SELECT * FROM departments"; // SQL query to select all departments
        const res = await connection.query(query);
        const departments = res.rows.map((department) => department.department_name);

        const answer = await inquirer.prompt({
            type: "list",
            name: "department",
            message: "Select the department to delete:", // Prompt user to select department for deletion
            choices: departments,
        });

        const departmentId = res.rows.find((dept) => dept.department_name === answer.department).id;
        const sql = "DELETE FROM departments WHERE id = $1"; // SQL query to delete the department
        await connection.query(sql, [departmentId]);
        console.log(`Deleted department ${answer.department} from the database!`); // Confirmation message for deleting department
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to delete a role
async function deleteRole() {
    try {
        const query = "SELECT * FROM roles"; // SQL query to select all roles
        const res = await connection.query(query);
        const roles = res.rows.map((role) => role.title);

        const answer = await inquirer.prompt({
            type: "list",
            name: "role",
            message: "Select the role to delete:", // Prompt user to select role for deletion
            choices: roles,
        });

        const roleId = res.rows.find((role) => role.title === answer.role).id;
        const sql = "DELETE FROM roles WHERE id = $1"; // SQL query to delete the role
        await connection.query(sql, [roleId]);
        console.log(`Deleted role ${answer.role} from the database!`); // Confirmation message for deleting role
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to delete an employee
async function deleteEmployee() {
    try {
        const query = `
            SELECT 
                id, 
                CONCAT(first_name, ' ', last_name) AS name 
            FROM 
                employee;
        `; // SQL query to select all employees
        const res = await connection.query(query);
        const employees = res.rows.map((employee) => employee.name);

        const answer = await inquirer.prompt({
            type: "list",
            name: "employee",
            message: "Select the employee to delete:", // Prompt user to select employee for deletion
            choices: employees,
        });

        const employeeId = res.rows.find((emp) => emp.name === answer.employee).id;
        const sql = "DELETE FROM employee WHERE id = $1"; // SQL query to delete the employee
        await connection.query(sql, [employeeId]);
        console.log(`Deleted employee ${answer.employee} from the database!`); // Confirmation message for deleting employee
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}

// Function to view the total utilized budget of a department
async function viewTotalUtilizedBudgetOfDepartment() {
    try {
        const query = "SELECT * FROM departments"; // SQL query to select all departments
        const res = await connection.query(query);
        const departments = res.rows.map((department) => department.department_name);

        const answer = await inquirer.prompt({
            type: "list",
            name: "department",
            message: "Select the department to view the total utilized budget:", // Prompt user to select department for budget view
            choices: departments,
        });

        const departmentId = res.rows.find((dept) => dept.department_name === answer.department).id;
        const sql = `
            SELECT 
                d.department_name, 
                SUM(r.salary) AS total_budget
            FROM 
                employee e
                LEFT JOIN roles r ON e.role_id = r.id
                LEFT JOIN departments d ON r.department_id = d.id
            WHERE 
                d.id = $1
            GROUP BY 
                d.department_name;
        `; // SQL query to calculate the total utilized budget for the selected department
        const budgetRes = await connection.query(sql, [departmentId]);
        console.table(budgetRes.rows); // Display the total budget in a table
        start(); // Restart the application
    } catch (error) {
        console.error(error); // Log any errors
    }
}