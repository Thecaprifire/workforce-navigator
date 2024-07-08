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
                            "INSERT INTO employee (first_name, last_name, role_id,                            role_id, manager_id) VALUES ($1, $2, $3, $4)";
                        const values = [answers.firstName, answers.lastName, answers.roleId, answers.managerId];
                        connection.query(sql, values, (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }

                            console.log("Employee added successfully!"); // Confirmation message for adding employee
                            start(); // Restart the application
                        });
                    });
            }
        );
    });
}

// Function to add a manager
function addManager() {
    // Retrieve list of employees without a manager from the database
    connection.query(
        `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee WHERE manager_id IS NULL`,
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

            // Prompt the user to select an employee to promote to manager
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "employeeId",
                        message: "Select an employee to promote to manager:", // Prompt to select employee
                        choices: employees,
                    },
                ])
                .then((answer) => {
                    // Update the employee's role to manager
                    const sql = "UPDATE employee SET role_id = (SELECT id FROM roles WHERE title = 'Manager') WHERE id = $1";
                    connection.query(sql, [answer.employeeId], (error, results) => {
                        if (error) {
                            console.error(error); // Log error if query fails
                            return;
                        }

                        console.log("Employee promoted to manager successfully!"); // Confirmation message for promotion
                        start(); // Restart the application
                    });
                });
        }
    );
}

// Function to update an employee's role
function updateEmployeeRole() {
    // Retrieve list of employees from the database
    connection.query(
        `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee`,
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

                // Prompt the user to select an employee and a new role
                inquirer
                    .prompt([
                        {
                            type: "list",
                            name: "employeeId",
                            message: "Select an employee to update:", // Prompt to select employee
                            choices: employees,
                        },
                        {
                            type: "list",
                            name: "roleId",
                            message: "Select the new role for the employee:", // Prompt to select role
                            choices: roles,
                        },
                    ])
                    .then((answers) => {
                        // Update the employee's role in the database
                        const sql = "UPDATE employee SET role_id = $1 WHERE id = $2";
                        connection.query(sql, [answers.roleId, answers.employeeId], (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }

                            console.log("Employee role updated successfully!"); // Confirmation message for updating role
                            start(); // Restart the application
                        });
                    });
            });
        }
    );
}

// Function to view employees by manager
function viewEmployeesByManager() {
    // Retrieve list of managers from the database
    connection.query(
        `SELECT DISTINCT m.id, CONCAT(m.first_name, ' ', m.last_name) AS name
         FROM employee e
         INNER JOIN employee m ON e.manager_id = m.id`,
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
                        message: "Select a manager to view their employees:", // Prompt to select manager
                        choices: managers,
                    },
                ])
                .then((answer) => {
                    // Retrieve list of employees for the selected manager
                    const sql = `
                        SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary
                        FROM employee e
                        INNER JOIN roles r ON e.role_id = r.id
                        INNER JOIN departments d ON r.department_id = d.id
                        WHERE e.manager_id = $1`;
                    connection.query(sql, [answer.managerId], (error, results) => {
                        if (error) {
                            console.error(error); // Log error if query fails
                            return;
                        }

                        console.table(results); // Display employees in a table
                        start(); // Restart the application
                    });
                });
        }
    );
}

// Function to view employees by department
function viewEmployeesByDepartment() {
    // Retrieve list of departments from the database
    connection.query("SELECT id, department_name FROM departments", (error, results) => {
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
                    message: "Select a department to view its employees:", // Prompt to select department
                    choices: departments,
                },
            ])
            .then((answer) => {
                // Retrieve list of employees for the selected department
                const sql = `
                    SELECT e.id, e.first_name, e.last_name, r.title, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
                    FROM employee e
                    INNER JOIN roles r ON e.role_id = r.id
                    INNER JOIN departments d ON r.department_id = d.id
                    LEFT JOIN employee m ON e.manager_id = m.id
                    WHERE d.id = $1`;
                connection.query(sql, [answer.departmentId], (error, results) => {
                    if (error) {
                        console.error(error); // Log error if query fails
                        return;
                    }

                    console.table(results); // Display employees in a table
                    start(); // Restart the application
                });
            });
    });
}

// Function to delete departments, roles, or employees
function deleteDepartmentsRolesEmployees() {
    inquirer
        .prompt({
            type: "list",
            name: "deleteChoice",
            message: "What would you like to delete?", // Prompt user for delete choice
            choices: [
                "Department",
                "Role",
                "Employee",
            ],
        })
        .then((answer) => {
            switch (answer.deleteChoice) {
                case "Department":
                    deleteDepartment();
                    break;
                case "Role":
                    deleteRole();
                    break;
                case "Employee":
                    deleteEmployee();
                    break;
            }
        });
}

// Function to delete a department
function deleteDepartment() {
    // Retrieve list of departments from the database
    connection.query("SELECT id, department_name FROM departments", (error, results) => {
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
                    message: "Select a department to delete:", // Prompt to select department
                    choices: departments,
                },
            ])
            .then((answer) => {
                // Delete the selected department from the database
                const sql = "DELETE FROM departments WHERE id = $1";
                connection.query(sql, [answer.departmentId], (error, results) => {
                    if (error) {
                        console.error(error); // Log error if query fails
                        return;
                    }

                    console.log("Department deleted successfully!"); // Confirmation message for deleting department
                    start(); // Restart the application
                });
            });
    });
}

// Function to delete a role
function deleteRole() {
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

                // Prompt the user to select a role to delete
                inquirer
                .prompt([
                    {
                        type: "list",
                        name: "roleId",
                        message: "Select a role to delete:", // Prompt to select role
                        choices: roles,
                    },
                ])
                .then((answer) => {
                    // Delete the selected role from the database
                    const sql = "DELETE FROM roles WHERE id = $1";
                    connection.query(sql, [answer.roleId], (error, results) => {
                        if (error) {
                            console.error(error); // Log error if query fails
                            return;
                        }
    
                        console.log("Role deleted successfully!"); // Confirmation message for deleting role
                        start(); // Restart the application
                    });
                });
        });
    }
    
    // Function to delete an employee
    function deleteEmployee() {
        // Retrieve list of employees from the database
        connection.query(
            `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee`,
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
    
                // Prompt the user to select an employee to delete
                inquirer
                    .prompt([
                        {
                            type: "list",
                            name: "employeeId",
                            message: "Select an employee to delete:", // Prompt to select employee
                            choices: employees,
                        },
                    ])
                    .then((answer) => {
                        // Delete the selected employee from the database
                        const sql = "DELETE FROM employee WHERE id = $1";
                        connection.query(sql, [answer.employeeId], (error, results) => {
                            if (error) {
                                console.error(error); // Log error if query fails
                                return;
                            }
    
                            console.log("Employee deleted successfully!"); // Confirmation message for deleting employee
                            start(); // Restart the application
                        });
                    });
            }
        );
    }
    
    // Function to view the total utilized budget of a department
    function viewTotalUtilizedBudgetOfDepartment() {
        // Retrieve list of departments from the database
        connection.query("SELECT id, department_name FROM departments", (error, results) => {
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
                        message: "Select a department to view its total utilized budget:", // Prompt to select department
                        choices: departments,
                    },
                ])
                .then((answer) => {
                    // Retrieve total utilized budget for the selected department
                    const sql = `
                        SELECT d.department_name, SUM(r.salary) AS total_utilized_budget
                        FROM employee e
                        INNER JOIN roles r ON e.role_id = r.id
                        INNER JOIN departments d ON r.department_id = d.id
                        WHERE d.id = $1
                        GROUP BY d.department_name`;
                    connection.query(sql, [answer.departmentId], (error, results) => {
                        if (error) {
                            console.error(error); // Log error if query fails
                            return;
                        }
    
                        console.table(results); // Display total utilized budget in a table
                        start(); // Restart the application
                    });
                });
        });
    }