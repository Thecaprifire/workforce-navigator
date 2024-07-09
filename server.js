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
        console.table(res.rows); // Display departments in a table
        start(); // Restart the application
    });
}

// Function to view all roles
function viewAllRoles() {
    const query = "SELECT roles.title, roles.id, departments.department_name, roles.salary from roles join departments on roles.department_id = departments.id"; // SQL query to select roles with department details
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows); // Display roles in a table
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
        console.table(res.rows); // Display employees in a table
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
        if (err) {
            console.error(err); // Log error if query fails
            return;
        }

        // Map departments from res.rows
        const departments = res.rows.map((department) => department.department_name);

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
                    choices: departments,
                },
            ])
            .then((answers) => {
                // Find department id based on department name selected
                const departmentId = res.rows.find(
                    (dept) => dept.department_name === answers.department
                ).id;

                // SQL query to insert new role
                const query = "INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)";
                const values = [answers.title, answers.salary, departmentId];

                // Execute the query
                connection.query(query, values, (err, res) => {
                    if (err) {
                        console.error(err); // Log error if query fails
                        return;
                    }

                    console.log(
                        `Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database!`
                    ); // Confirmation message for adding role
                    start(); // Restart the application
                });
            });
    });
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
        console.log("Employee added successfully!");
        start();
    } catch (error) {
        console.error(error);
    }
}


// Function to add a manager
function addManager() {
    const employeeQuery = 'SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee';
    connection.query(employeeQuery, (err, employeeRes) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return;
        }
        const employees = employeeRes.rows.map(({ id, name }) => ({
            name,
            value: id,
        }));

        inquirer
        .prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Select the employee to promote as manager:',
                choices: employees,
            },
            {
                type: 'input',
                name: 'departmentName',
                message: 'Enter the department name for the manager:',
            },
        ])
        .then((answers) => {
            const managerId = answers.managerId;
            const departmentName = answers.departmentName;

            const departmentQuery = 'SELECT id FROM departments WHERE department_name = $1';
            connection.query(departmentQuery, [departmentName], (err, departmentRes) => {
                if (err) {
                    console.error('Error fetching department:', err);
                    return;
                }
                if (departmentRes.rows.length === 0) {
                    console.log(`Department ${departmentName} does not exist!`);
                    return;
                }

                const departmentId = departmentRes.rows[0].id;
                const updateQuery = 'UPDATE employee SET manager_id = $1, department_id = $2 WHERE id = $3';
                connection.query(updateQuery, [managerId, departmentId, managerId], (err) => {
                    if (err) {
                        console.error('Error updating employee:', err);
                        return;
                    }
                    console.log(`Employee with ID ${managerId} is now a manager of the ${departmentName} department!`);
                    start(); // Ensure start() is defined and called correctly
                });
            });
        });
    });
}

// Function to update an employee's role
async function updateEmployeeRole() {
    try {
        // Retrieve list of employees
        const employeeResults = await connection.query("SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee");
        const employees = employeeResults.rows.map(({ id, name }) => ({ name, value: id }));

        // Retrieve list of roles
        const roleResults = await connection.query("SELECT id, title FROM roles");
        const roles = roleResults.rows.map(({ id, title }) => ({ name: title, value: id }));

        // Prompt user to select an employee and a new role
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Select an employee to update:",
                choices: employees,
            },
            {
                type: "list",
                name: "roleId",
                message: "Select the new role for the employee:",
                choices: roles,
            },
        ]);

        // Update the employee's role in the database
        const sql = "UPDATE employee SET role_id = $1 WHERE id = $2";
        await connection.query(sql, [answers.roleId, answers.employeeId]);

        console.log("Employee role updated successfully!");
        start(); // Restart the application
    } catch (error) {
        console.error("Error updating employee role:", error);
    }
}

// Function to view employees by manager
async function viewEmployeesByManager() {
    try {
        // Retrieve list of managers from the database
        const managersQuery = `
            SELECT DISTINCT m.id, CONCAT(m.first_name, ' ', m.last_name) AS name
            FROM employee e
            INNER JOIN employee m ON e.manager_id = m.id
        `;
        const managersResult = await connection.query(managersQuery);
        const managers = managersResult.rows.map(({ id, name }) => ({ name, value: id }));

        // Prompt the user to select a manager
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "managerId",
                message: "Select a manager to view their employees:",
                choices: managers,
            },
        ]);

        // Retrieve list of employees for the selected manager
        const employeesQuery = `
            SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary
            FROM employee e
            INNER JOIN roles r ON e.role_id = r.id
            INNER JOIN departments d ON r.department_id = d.id
            WHERE e.manager_id = $1
        `;
        const employeesResult = await connection.query(employeesQuery, [answer.managerId]);
        const employees = employeesResult.rows;

        console.table(employees); // Display employees in a table
        start(); // Restart the application
    } catch (error) {
        console.error("Error viewing employees by manager:", error);
    }
}

// Function to view employees by department
async function viewEmployeesByDepartment() {
    try {
        // Retrieve list of departments from the database
        const departmentsQuery = "SELECT id, department_name FROM departments";
        const departmentsResult = await connection.query(departmentsQuery);
        const departments = departmentsResult.rows.map(({ id, department_name }) => ({
            name: department_name,
            value: id,
        }));

        // Prompt the user to select a department
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "departmentId",
                message: "Select a department to view its employees:",
                choices: departments,
            },
        ]);

        // Retrieve list of employees for the selected department
        const employeesQuery = `
            SELECT e.id, e.first_name, e.last_name, r.title, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
            FROM employee e
            INNER JOIN roles r ON e.role_id = r.id
            INNER JOIN departments d ON r.department_id = d.id
            LEFT JOIN employee m ON e.manager_id = m.id
            WHERE d.id = $1
        `;
        const employeesResult = await connection.query(employeesQuery, [answer.departmentId]);
        const employees = employeesResult.rows;

        console.table(employees); // Display employees in a table
        start(); // Restart the application
    } catch (error) {
        console.error("Error viewing employees by department:", error);
    }
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
    const departmentsQuery = "SELECT id, department_name FROM departments";
    connection.query(departmentsQuery, (error, results) => {
        if (error) {
            console.error(error); // Log error if query fails
            return;
        }

        // Ensure results exist and are in expected format
        if (!results || !Array.isArray(results) || results.length === 0) {
            console.log("No departments found to delete.");
            start(); // Restart the application
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
                const deleteQuery = "DELETE FROM departments WHERE id = $1";
                connection.query(deleteQuery, [answer.departmentId], (error, deleteResult) => {
                    if (error) {
                        console.error(error); // Log error if delete query fails
                        return;
                    }

                    console.log("Department deleted successfully!"); // Confirmation message for deleting department
                    start(); // Restart the application
                });
            });
    });
}

// Function to delete a role (similar approach can be applied to deleteEmployee())
function deleteRole() {
    // Retrieve list of roles from the database
    const rolesQuery = "SELECT id, title FROM roles";
    connection.query(rolesQuery, (error, results) => {
        if (error) {
            console.error(error); // Log error if query fails
            return;
        }

        // Ensure results exist and are in expected format
        if (!results || !Array.isArray(results) || results.length === 0) {
            console.log("No roles found to delete.");
            start(); // Restart the application
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
                const deleteQuery = "DELETE FROM roles WHERE id = $1";
                connection.query(deleteQuery, [answer.roleId], (error, deleteResult) => {
                    if (error) {
                        console.error(error); // Log error if delete query fails
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
    const employeesQuery = "SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee";
    connection.query(employeesQuery, (error, results) => {
        if (error) {
            console.error(error); // Log error if query fails
            return;
        }

        // Ensure results exist and are in expected format
        if (!results || !Array.isArray(results) || results.length === 0) {
            console.log("No employees found to delete.");
            start(); // Restart the application
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
                const deleteQuery = "DELETE FROM employee WHERE id = $1";
                connection.query(deleteQuery, [answer.employeeId], (error, deleteResult) => {
                    if (error) {
                        console.error(error); // Log error if delete query fails
                        return;
                    }

                    console.log("Employee deleted successfully!"); // Confirmation message for deleting employee
                    start(); // Restart the application
                });
            });
    });
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