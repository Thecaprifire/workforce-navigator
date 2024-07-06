require('dotenv').config(); // Load environment variables from .env file

// Import necessary modules
const inquirer = require("inquirer"); // For user prompts
const { Client } = require("pg"); // PostgreSQL database connection
const cfonts = require('cfonts'); // Styling console output

// Create a PostgreSQL connection configuration
const connection = new Client({
    host: "localhost", // PostgreSQL server host
    user: "", // PostgreSQL username
    password: "", // PostgreSQL password
    database: "employeetracker_db", // Database name
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
            const query = `INSERT INTO departments (department_name) VALUES ("${answer.name}")`; // SQL query to insert a new department
            connection.query(query, (err, res) => {
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
                    choices: res.map(
                        (department) => department.department_name
                    ), // List of department choices from database
                },
            ])
            .then((answers) => {
                const department = res.find(
                    (department) => department.name === answers.department
                ); // Find selected department object
                const query = "INSERT INTO roles SET ?"; // SQL query to insert new role
                connection.query(
                    query,
                    {
                        title: answers.title,
                        salary: answers.salary,
                        department_id: department,
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
                            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)";
                        const values = [
                            answers.firstName,
                            answers.lastName,
                            answers.roleId,
                            answers.managerId,
                        ];
                        connection.query(sql, values, (error) => {
                            if (error) {
                                console.error(error); // Log error if insertion fails
                                return;
                            }

                            console.log("Employee added successfully"); // Success message
                            start(); // Restart the application
                        });
                    })
                    .catch((error) => {
                        console.error(error); // Log any unexpected errors
                    });
            }
        );
    });
}

// Function to add a Manager
function addManager() {
    const queryDepartments = "SELECT * FROM departments"; // SQL query to select all departments
    const queryEmployees = "SELECT * FROM employee"; // SQL query to select all employees

    connection.query(queryDepartments, (err, resDepartments) => {
        if (err) throw err; // Throw error if query fails
        connection.query(queryEmployees, (err, resEmployees) => {
            if (err) throw err; // Throw error if query fails
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "department",
                        message: "Select the department:", // Prompt to select department
                        choices: resDepartments.map(
                            (department) => department.department_name
                        ), // List of department choices
                    },
                    {
                        type: "list",
                        name: "employee",
                        message: "Select the employee to add a manager to:", // Prompt to select employee
                        choices: resEmployees.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ), // List of employee choices
                    },
                    {
                        type: "list",
                        name: "manager",
                        message: "Select the employee's manager:", // Prompt to select manager
                        choices: resEmployees.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ), // List of manager choices
                    },
                ])
                .then((answers) => {
                    const department = resDepartments.find(
                        (department) =>
                            department.department_name === answers.department
                    ); // Find selected department object
                    const employee = resEmployees.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` ===
                            answers.employee
                    ); // Find selected employee object
                    const manager = resEmployees.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` ===
                            answers.manager
                    ); // Find selected manager object
                    const query =
                        "UPDATE employee SET manager_id = ? WHERE id = ? AND role_id IN (SELECT id FROM roles WHERE department_id = ?)";
                    connection.query(
                        query,
                        [manager.id, employee.id, department.id],
                        (err, res) => {
                            if (err) throw err; // Throw error if query fails
                            console.log(
                                `Added manager ${manager.first_name} ${manager.last_name} to employee ${employee.first_name} ${employee.last_name} in department ${department.department_name}!`
                            ); // Success message
                            start(); // Restart the application
                        }
                    );
                });
        });
    });
}

// Function to update an employee role
function updateEmployeeRole() {
    const queryEmployees =
        "SELECT employee.id, employee.first_name, employee.last_name, roles.title FROM employee LEFT JOIN roles ON employee.role_id = roles.id"; // SQL query to retrieve employees and their current roles
    const queryRoles = "SELECT * FROM roles"; // SQL query to retrieve all roles
    connection.query(queryEmployees, (err, resEmployees) => {
        if (err) throw err; // Throw error if query fails
        connection.query(queryRoles, (err, resRoles) => {
            if (err) throw err; // Throw error if query fails
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "employee",
                        message: "Select the employee to update:", // Prompt to select employee to update
                        choices: resEmployees.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ), // List of employee choices
                    },
                    {
                        type: "list",
                        name: "role",
                        message: "Select the new role:", // Prompt to select new role
                        choices: resRoles.map((role) => role.title), // List of role choices
                    },
                ])
                .then((answers) => {
                    const employee = resEmployees.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` ===
                            answers.employee
                    ); // Find selected employee object
                    const role = resRoles.find(
                        (role) => role.title === answers.role
                    ); // Find selected role object
                    const query =
                        "UPDATE employee SET role_id = ? WHERE id = ?"; // SQL query to update employee role
                    connection.query(
                        query,
                        [role.id, employee.id],
                        (err, res) => {
                            if (err) throw err; // Throw error if query fails
                            console.log(
                                `Updated ${employee.first_name} ${employee.last_name}'s role to ${role.title} in the database!`
                            ); // Success message
                            start(); // Restart the application
                        }
                    );
                });
        });
    });
}

// Function to view employees grouped by manager
function viewEmployeesByManager() {
    const query = `
      SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        r.title, 
        d.department_name, 
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM 
        employee e
        INNER JOIN roles r ON e.role_id = r.id
        INNER JOIN departments d ON r.department_id = d.id
        LEFT JOIN employee m ON e.manager_id = m.id
      ORDER BY 
        manager_name, 
        e.last_name, 
        e.first_name
    `; // SQL query to retrieve employees with their managers and departments

    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails

        // Group employees by manager
        const employeesByManager = res.reduce((acc, cur) => {
            const managerName = cur.manager_name;
            if (acc[managerName]) {
                acc[managerName].push(cur);
            } else {
                acc[managerName] = [cur];
            }
            return acc;
        }, {});

        // Display employees by manager
        console.log("Employees by manager:");
        for (const managerName in employeesByManager) {
            console.log(`\n${managerName}:`);
            const employees = employeesByManager[managerName];
            employees.forEach((employee) => {
                console.log(
                    `  ${employee.first_name} ${employee.last_name} | ${employee.title} | ${employee.department_name}`
                );
            });
        }

        // Restart the application
        start();
    });
}

// Function to view employees by department
function viewEmployeesByDepartment() {
    const query =
        "SELECT departments.department_name, employee.first_name, employee.last_name FROM employee INNER JOIN roles ON employee.role_id = roles.id INNER JOIN departments ON roles.department_id = departments.id ORDER BY departments.department_name ASC"; // SQL query to retrieve employees grouped by department

    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails
        console.log("\nEmployees by department:");
        console.table(res); // Display employees in a table grouped by department
        start(); // Restart the application
    });
}

// Function to DELETE Departments Roles Employees
function deleteDepartmentsRolesEmployees() {
    inquirer
        .prompt({
            type: "list",
            name: "data",
            message: "What would you like to delete?", // Prompt to select what to delete
            choices: ["Employee", "Role", "Department"], // Choices for deletion
        })
        .then((answer) => {
            switch (answer.data) {
                case "Employee":
                    deleteEmployee(); // Call deleteEmployee function if "Employee" is chosen
                    break;
                case "Role":
                    deleteRole(); // Call deleteRole function if "Role" is chosen
                    break;
                case "Department":
                    deleteDepartment(); // Call deleteDepartment function if "Department" is chosen
                    break;
                default:
                    console.log(`Invalid data: ${answer.data}`); // Log error for invalid selection
                    start(); // Restart the application
                    break;
            }
        });
}

// Function to DELETE Employees
function deleteEmployee() {
    const query = "SELECT * FROM employee"; // SQL query to select all employees
    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails
        const employeeList = res.map((employee) => ({
            name: `${employee.first_name} ${employee.last_name}`, // Employee's full name
            value: employee.id, // Employee's ID
        }));
        employeeList.push({ name: "Go Back", value: "back" }); // Add a "Go Back" option to the list of choices
        inquirer
            .prompt({
                type: "list",
                name: "id",
                message: "Select the employee you want to delete:", // Prompt to select employee to delete
                choices: employeeList, // List of employee choices
            })
            .then((answer) => {
                if (answer.id === "back") {
                    // Check if user selected "back"
                    deleteDepartmentsRolesEmployees(); // Go back to the deleteDepartmentsRolesEmployees function
                    return;
                }
                const query = "DELETE FROM employee WHERE id = ?"; // SQL query to delete employee
                connection.query(query, [answer.id], (err, res) => {
                    if (err) throw err; // Throw error if query fails
                    console.log(
                        `Deleted employee with ID ${answer.id} from the database!`
                    ); // Success message
                    start(); // Restart the application
                });
            });
    });
}

// Function to DELETE Role
function deleteRole() {
    // Retrieve all available roles from the database
    const query = "SELECT * FROM roles";
    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails
        // Map through the retrieved roles to create an array of choices
        const choices = res.map((role) => ({
            name: `${role.title} (${role.id}) - ${role.salary}`, // Role's title, ID, and salary
            value: role.id, // Role's ID
        }));
        // Add a "Go Back" option to the list of choices
        choices.push({ name: "Go Back", value: null });
        inquirer
            .prompt({
                type: "list",
                name: "roleId",
                message: "Select the role you want to delete:", // Prompt to select role to delete
                choices: choices, // List of role choices
            })
            .then((answer) => {
                // Check if the user chose the "Go Back" option
                if (answer.roleId === null) {
                    // Go back to the deleteDepartmentsRolesEmployees function
                    deleteDepartmentsRolesEmployees();
                    return;
                }
                const query = "DELETE FROM roles WHERE id = ?"; // SQL query to delete role
                connection.query(query, [answer.roleId], (err, res) => {
                    if (err) throw err; // Throw error if query fails
                    console.log(
                        `Deleted role with ID ${answer.roleId} from the database!`
                    ); // Success message
                    start(); // Restart the application
                });
            });
    });
}

// Function to DELETE Department
function deleteDepartment() {
    // Get the list of departments from the database
    const query = "SELECT * FROM departments";
    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails
        const departmentChoices = res.map((department) => ({
            name: department.department_name, // Department's name
            value: department.id, // Department's ID
        }));

        // Prompt the user to select a department
        inquirer
            .prompt({
                type: "list",
                name: "departmentId",
                message: "Which department do you want to delete?", // Prompt to select department to delete
                choices: [
                    ...departmentChoices,
                    { name: "Go Back", value: "back" },
                ], // List of department choices
            })
            .then((answer) => {
                if (answer.departmentId === "back") {
                    // Go back to the previous menu
                    deleteDepartmentsRolesEmployees();
                } else {
                    const query = "DELETE FROM departments WHERE id = ?"; // SQL query to delete department
                    connection.query(
                        query,
                        [answer.departmentId],
                        (err, res) => {
                            if (err) throw err; // Throw error if query fails
                            console.log(
                                `Deleted department with ID ${answer.departmentId} from the database!`
                            ); // Success message
                            start(); // Restart the application
                        }
                    );
                }
            });
    });
}

// Function to view Total Utilized Budget of Department
function viewTotalUtilizedBudgetOfDepartment() {
    const query = "SELECT * FROM departments"; // SQL query to select all departments
    connection.query(query, (err, res) => {
        if (err) throw err; // Throw error if query fails
        const departmentChoices = res.map((department) => ({
            name: department.department_name, // Department's name
            value: department.id, // Department's ID
        }));

        // Prompt the user to select a department
        inquirer
            .prompt({
                type: "list",
                name: "departmentId",
                message:
                    "Which department do you want to calculate the total salary for?", // Prompt to select department for salary calculation
                choices: departmentChoices, // List of department choices
            })
            .then((answer) => {
                // Calculate the total salary for the selected department
                const query =
                    `SELECT 
                    departments.department_name AS department,
                    SUM(roles.salary) AS total_salary
                  FROM 
                    departments
                    INNER JOIN roles ON departments.id = roles.department_id
                    INNER JOIN employee ON roles.id = employee.role_id
                  WHERE 
                    departments.id = ?
                  GROUP BY 
                    departments.id;`;
                connection.query(query, [answer.departmentId], (err, res) => {
                    if (err) throw err; // Throw error if query fails
                    const totalSalary = res[0].total_salary; // Total salary calculated
                    console.log(
                        `The total salary for employees in this department is $${totalSalary}`
                    ); // Display total salary
                    start(); // Restart the application
                });
            });
    });
}

// Close the connection when the application exits
process.on("exit", () => {
    connection.end();
});
