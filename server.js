require('dotenv').config(); // Load environment variables from .env file

// Import necessary modules
const inquirer = require("inquirer"); // For user prompts
const { Client } = require("pg"); // PostgreSQL database connection
const cfonts = require('cfonts'); // Styling console output

// Create a PostgreSQL connection configuration
const connection = new Client({
    host: "localhost", // PostgreSQL server host
    user: process.env.PG_USER, // PostgreSQL username
    password: process.env.PG_PASSWORD, // PostgreSQL password
    database: "employeetracker_db", // Database name
    port: 5432, // PostgreSQL server port 
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
    font: 'block', // Font face for the title
    align: 'left', // Alignment of the text
    colors: ['red'], // Color of the text
    background: 'transparent', // Background color
    letterSpacing: 1, // Letter spacing
    lineHeight: 1, // Line height
    space: true, // Empty lines on top and bottom
    maxLength: '0', // Maximum characters per line
    gradient: false, // Gradient colors
    independentGradient: false, // Separate gradients for each line
    transitionGradient: false, // Color transition effect
    env: 'node' // Environment where cfonts runs
});

// Function to start the application
function start() {
    // Prompt user with choices
    inquirer
        .prompt({
            type: "list",
            name: "action",
            message: "What would you like to do?", // User prompt message
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role",
                "Add an employee",
                "Add a Manager",
                "Update an employee role",
                "View Employees by Manager",
                "View Employees by Department",
                "Delete Departments | Roles | Employees",
                "View the total utilized budget of a department",
                "Exit",
            ],
        })
        .then((answer) => {
            // Perform action based on user choice
            switch (answer.action) {
                case "View all departments":
                    viewAllDepartments();
                    break;
                case "View all roles":
                    viewAllRoles();
                    break;
                case "View all employees":
                    viewAllEmployees();
                    break;
                case "Add a department":
                    addDepartment();
                    break;
                case "Add a role":
                    addRole();
                    break;
                case "Add an employee":
                    addEmployee();
                    break;
                case "Add a Manager":
                    addManager();
                    break;
                case "Update an employee role":
                    updateEmployeeRole();
                    break;
                case "View Employees by Manager":
                    viewEmployeesByManager();
                    break;
                case "View Employees by Department":
                    viewEmployeesByDepartment();
                    break;
                case "Delete Departments | Roles | Employees":
                    deleteDepartmentsRolesEmployees();
                    break;
                case "View the total utilized budget of a department":
                    viewTotalUtilizedBudgetOfDepartment();
                    break;
                case "Exit":
                    connection.end(); // Close database connection
                    console.log("Goodbye!"); // Exit message
                    break;
            }
        });
}

// Function to view all departments
function viewAllDepartments() {
    const query = "SELECT * FROM departments"; // SQL query to select all departments
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res); // Display departments in a table
        start(); // Restart the application
    });
}

// Function to view all roles
function viewAllRoles() {
    const query = "SELECT roles.title, roles.id, departments.department_name, roles.salary from roles join departments on roles.department_id = departments.id"; // SQL query to select roles with department details
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res); // Display roles in a table
        start(); // Restart the application
    });
}

// Function to view all employees
function viewAllEmployees() {
    const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
    FROM employee e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id;
    `; // SQL query to select all employees with detailed information
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res); // Display employees in a table
        start(); // Restart the application
    });
}

// Function to add a department
function addDepartment() {
    inquirer
        .prompt({
            type: "input",
            name: "name",
            message: "Enter the name of the new department:", // Prompt user for department name
        })
        .then((answer) => {
            console.log(answer.name); // Log the department name entered
            const query = `INSERT INTO departments (department_name) VALUES ($1)`; // SQL query to insert a new department
            connection.query(query, [answer.name], (err, res) => {
                if (err) throw err;
                console.log(`Added department ${answer.name} to the database!`); // Confirmation message for adding department
                start(); // Restart the application
                console.log(answer.name); // Log the department name again
            });
        });
}

// Function to add a role
function addRole() {
    const query = "SELECT * FROM departments"; // SQL query to select all departments
    connection.query(query, (err, res) => {
      if (err) throw err;
      inquirer
        .prompt([
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
            choices: res.map((department) => department.department_name), // List of department choices from database
          },
        ])
        .then((answers) => {
          const department = res.find(
            (department) => department.department_name === answers.department
          ); // Find selected department object
          const query = "INSERT INTO roles SET ?"; // SQL query to insert new role
          connection.query(
            query,
            {
              title: answers.title,
              salary: answers.salary,
              department_id: department.id,
            }, // Role details
            (err, res) => {
              if (err) throw err;
              console.log(
                `Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database!`
              ); // Confirmation message for adding role
              start(); // Restart the application
            }
          );
        });
    });
  }

// Function to add an employee
function addEmployee() {
    // Retrieve list of roles from the database
    connection.query("SELECT id, title FROM roles", (error, results) => {
        if (error) {
            console.error(error); // Log error if query fails
            return;
        }

        // Map results to format required by Inquirer choices
        const roles = results.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        // Retrieve list of employees from the database to use as managers
        connection.query(
            'SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee',
            (error, results) => {
                if (error) {
                    console.error(error); // Log error if query fails
                    return;
                }

                // Map results to format required by Inquirer choices
                const managers = results.map(({ id, name }) => ({
                    name,
                    value: id,
                }));

                // Prompt the user for employee information
                inquirer
                    .prompt([
                        {
                            type: "input",
                            name: "firstName",
                            message: "Enter the employee's first name:", // Prompt for first name
                        },
                        {
                            type: "input",
                            name: "lastName",
                            message: "Enter the employee's last name:", // Prompt for last name
                        },
                        {
                            type: "list",
                            name: "roleId",
                            message: "Select the employee role:", // Prompt to select role
                            choices: roles,
                        },
                        {
                            type: "list",
                            name: "managerId",
                            message: "Select the employee manager:", // Prompt to select manager
                            choices: [
                                { name: "None", value: null }, // Option for no manager
                                ...managers,
                            ],
                        },
                    ])
                    .then((answers) => {
                                                // Insert the employee into the database
                                                const sql =
                                                "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)";
                                            const params = [
                                                answers.firstName,
                                                answers.lastName,
                                                answers.roleId,
                                                answers.managerId,
                                            ];
                    
                                            connection.query(sql, params, (error, result) => {
                                                if (error) {
                                                    console.error(error); // Log error if query fails
                                                } else {
                                                    console.log(
                                                        `Added employee ${answers.firstName} ${answers.lastName} to the database!`
                                                    ); // Confirmation message for adding employee
                                                }
                                                start(); // Restart the application
                                            });
                                        });
                                }
                            );
                        });
                    }
                    
                    // Function to add a Manager
                    function addManager() {
                        // Retrieve list of employees from the database to use as managers
                        connection.query(
                            'SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee',
                            (error, results) => {
                                if (error) {
                                    console.error(error); // Log error if query fails
                                    return;
                                }
                    
                                // Map results to format required by Inquirer choices
                                const employees = results.map(({ id, name }) => ({
                                    name,
                                    value: id,
                                }));
                    
                                // Prompt the user for manager information
                                inquirer
                                    .prompt([
                                        {
                                            type: "list",
                                            name: "employeeId",
                                            message: "Select the employee to set as a Manager:", // Prompt to select employee as manager
                                            choices: employees,
                                        },
                                    ])
                                    .then((answers) => {
                                        // Update the selected employee's role to Manager in the database
                                        const sql =
                                            "UPDATE employee SET role_id = 1 WHERE id = ?"; // Assuming role_id 1 represents the Manager role
                                        const params = [answers.employeeId];
                    
                                        connection.query(sql, params, (error, result) => {
                                            if (error) {
                                                console.error(error); // Log error if query fails
                                            } else {
                                                console.log(
                                                    `Employee ${answers.employeeId} set as Manager successfully!`
                                                ); // Confirmation message for setting employee as manager
                                            }
                                            start(); // Restart the application
                                        });
                                    });
                            }
                        );
                    }
                    
                    // Function to update an employee's role
                    function updateEmployeeRole() {
                        // Retrieve list of employees from the database
                        connection.query("SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee", (error, employees) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const employeeChoices = employees.map(({ id, name }) => ({
                                name,
                                value: id,
                            }));
                    
                            // Retrieve list of roles from the database
                            connection.query("SELECT id, title FROM roles", (error, roles) => {
                                if (error) {
                                    console.error(error); // Log error if query fails
                                    return;
                                }
                    
                                // Map results to format required by Inquirer choices
                                const roleChoices = roles.map(({ id, title }) => ({
                                    name: title,
                                    value: id,
                                }));
                    
                                // Prompt user to select an employee and new role
                                inquirer
                                    .prompt([
                                        {
                                            type: "list",
                                            name: "employeeId",
                                            message: "Select the employee to update:", // Prompt to select employee to update
                                            choices: employeeChoices,
                                        },
                                        {
                                            type: "list",
                                            name: "roleId",
                                            message: "Select the new role for the employee:", // Prompt to select new role
                                            choices: roleChoices,
                                        },
                                    ])
                                    .then((answers) => {
                                        // Update the selected employee's role in the database
                                        const sql = "UPDATE employee SET role_id = ? WHERE id = ?";
                                        const params = [answers.roleId, answers.employeeId];
                    
                                        connection.query(sql, params, (error, result) => {
                                            if (error) {
                                                console.error(error); // Log error if query fails
                                            } else {
                                                console.log(
                                                    `Employee ${answers.employeeId} role updated successfully!`
                                                ); // Confirmation message for updating employee role
                                            }
                                            start(); // Restart the application
                                        });
                                    });
                            });
                        });
                    }
                    
                    // Function to view employees by manager
                    function viewEmployeesByManager() {
                        // Retrieve list of employees to use as managers
                        connection.query(
                            'SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee',
                            (error, results) => {
                                if (error) {
                                    console.error(error); // Log error if query fails
                                    return;
                                }
                    
                                // Map results to format required by Inquirer choices
                                const managers = results.map(({ id, name }) => ({
                                    name,
                                    value: id,
                                }));
                    
                                // Prompt the user to select a manager
                                inquirer
                                    .prompt([
                                        {
                                            type: "list",
                                            name: "managerId",
                                            message: "Select the manager to view employees:", // Prompt to select manager
                                            choices: managers,
                                        },
                                    ])
                                    .then((answers) => {
                                        // Query to select employees by manager
                                        const query = `
                                        SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
                                        FROM employee e
                                        LEFT JOIN roles r ON e.role_id = r.id
                                        LEFT JOIN departments d ON r.department_id = d.id
                                        LEFT JOIN employee m ON e.manager_id = m.id
                                        WHERE e.manager_id = ?
                                        `;
                    
                                        connection.query(query, [answers.managerId], (err, res) => {
                                            if (err) throw err;
                                            console.table(res); // Display employees managed by selected manager in a table
                                            start(); // Restart the application
                                        });
                                    });
                            }
                        );
                    }
                    
                    // Function to view employees by department
                    function viewEmployeesByDepartment() {
                        // Retrieve list of departments from the database
                        connection.query("SELECT * FROM departments", (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const departments = results.map(({ id, department_name }) => ({
                                name: department_name,
                                value: id,
                            }));
                    
                            // Prompt the user to select a department
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "departmentId",
                                        message: "Select the department to view employees:", // Prompt to select department
                                        choices: departments,
                                    },
                                ])
                                .then((answers) => {
                                    // Query to select employees by department
                                    const query = `
                                    SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
                                    FROM employee e
                                    LEFT JOIN roles r ON e.role_id = r.id
                                    LEFT JOIN departments d ON r.department_id = d.id
                                    LEFT JOIN employee m ON e.manager_id = m.id
                                    WHERE d.id = ?
                                    `;
                    
                                    connection.query(query, [answers.departmentId], (err, res) => {
                                        if (err) throw err;
                                        console.table(res); // Display employees in selected department in a table
                                        start(); // Restart the application
                                    });
                                });
                        });
                    }
                    
                    // Function to delete departments, roles, or employees
                    function deleteDepartmentsRolesEmployees() {
                        // Prompt user for deletion type
                        inquirer
                            .prompt({
                                type: "list",
                                name: "action",
                                message: "What would you like to delete?", // Prompt message
                                choices: [
                                    "Delete a department",
                                    "Delete a role",
                                    "Delete an employee",
                                    "Go back",
                                ],
                            })
                            .then((answer) => {
                                // Perform action based on user choice
                                switch (answer.action) {
                                    case "Delete a department":
                                        deleteDepartment();
                                        break;
                                    case "Delete a role":
                                        deleteRole();
                                        break;
                                    case "Delete an employee":
                                        deleteEmployee();
                                        break;
                                    case "Go back":
                                        start(); // Return to main menu
                                        break;
                                }
                            });
                    }
                    
                    // Function to delete a department
                    function deleteDepartment() {
                        // Retrieve list of departments from the database
                        connection.query("SELECT * FROM departments", (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const departments = results.map(({ id, department_name }) => ({
                                name: department_name,
                                value: id,
                            }));
                    
                            // Prompt the user to select a department to delete
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "departmentId",
                                        message: "Select the department to delete:", // Prompt to select department
                                        choices: departments,
                                    },
                                ])
                                .then((answers) => {
                                    // Delete the selected department from the database
                                    const query = "DELETE FROM departments WHERE id = ?";
                                    connection.query(query, [answers.departmentId], (err, res) => {
                                        if (err) throw err;
                                        console.log(`Department with ID ${answers.departmentId} deleted successfully!`); // Confirmation message for deleting department
                                        start(); // Restart the application
                                    });
                                });
                        });
                    }
                    
                    // Function to delete a role
                    function deleteRole() {
                        // Retrieve list of roles from the database
                        connection.query("SELECT * FROM roles", (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const roles = results.map(({ id, title }) => ({
                                name: title,
                                value: id,
                            }));
                    
                            // Prompt the user to select a role to delete
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "roleId",
                                        message: "Select the role to delete:", // Prompt to select role
                                        choices: roles,
                                    },
                                ])
                                .then((answers) => {
                                    // Delete the selected role from the database
                                    const query = "DELETE FROM roles WHERE id = ?";
                                    connection.query(query, [answers.roleId], (err, res) => {
                                        if (err) throw err;
                                        console.log(`Role with ID ${answers.roleId} deleted successfully!`); // Confirmation message for deleting role
                                        start(); // Restart the application
                                    });
                                });
                        });
                    }
                    
                    // Function to delete an employee
                    function deleteEmployee() {
                        // Retrieve list of employees from the database
                        connection.query("SELECT * FROM employee", (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const employees = results.map(({ id, first_name, last_name }) => ({
                                name: `${first_name} ${last_name}`,
                                value: id,
                            }));
                    
                            // Prompt the user to select an employee to delete
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "employeeId",
                                        message: "Select the employee to delete:", // Prompt to select employee
                                        choices: employees,
                                    },
                                ])
                                .then((answers) => {
                                    // Delete the selected employee from the database
                                    const query = "DELETE FROM employee WHERE id = ?";
                                    connection.query(query, [answers.employeeId], (err, res) => {
                                        if (err) throw err;
                                        console.log(`Employee with ID ${answers.employeeId} deleted successfully!`); // Confirmation message for deleting employee
                                        start(); // Restart the application
                                    });
                                });
                        });
                    }
                    
                    // Function to view the total utilized budget of a department
                    function viewTotalUtilizedBudgetOfDepartment() {
                        // Retrieve list of departments from the database
                        connection.query("SELECT * FROM departments", (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
                    
                            // Map results to format required by Inquirer choices
                            const departments = results.map(({ id, department_name }) => ({
                                name: department_name,
                                value: id,
                            }));
                    
                            // Prompt the user to select a department to view budget
                            inquirer
                                .prompt([
                                    {
                                        type: "list",
                                        name: "departmentId",
                                        message: "Select the department to view total utilized budget:", // Prompt to select department
                                        choices: departments,
                                    },
                                ])
                                .then((answers) => {
                                    // Query to calculate total utilized budget of selected department
                                    const query = `
                                    SELECT d.department_name, SUM(r.salary) AS utilized_budget
                                    FROM employee e
                                    LEFT JOIN roles r ON e.role_id = r.id
                                    LEFT JOIN departments d ON r.department_id = d.id
                                    WHERE d.id = ?
                                    GROUP BY d.department_name
                                    `;
                    
                                    connection.query(query, [answers.departmentId], (err, res) => {
                                        if (err) throw err;
                                        console.table(res); // Display total utilized budget of selected department
                                        start(); // Restart the application
                                    });
                                });
                        });
                    }
                    
                    // Exit message
                    process.on("exit", () => {
                        console.log("Goodbye!"); // Log message when exiting the application
                    });
                    
                    // Error handler
                    process.on("unhandledRejection", (err) => {
                        console.error(err); // Log unhandled promise rejections
                    });
                    
                    // Export connection for testing
                    module.exports = connection;