document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // ToDo functionality
  const todoForm = document.getElementById("todo-form");
  const todosList = document.getElementById("todos-list");
  const todoMessageDiv = document.getElementById("todo-message");
  let currentTodoEmail = "";

  // Function to fetch todos for a specific email
  async function fetchTodos(email) {
    if (!email) {
      todosList.innerHTML = "<p>Enter your email above to view your tasks</p>";
      return;
    }

    try {
      const response = await fetch(`/todos?email=${encodeURIComponent(email)}`);
      const todos = await response.json();

      if (todos.length === 0) {
        todosList.innerHTML = "<p>No tasks yet. Add your first task above!</p>";
        return;
      }

      todosList.innerHTML = "";
      todos.forEach((todo) => {
        const todoCard = document.createElement("div");
        todoCard.className = `todo-card ${todo.completed ? "completed" : ""}`;

        // Create content div
        const contentDiv = document.createElement("div");
        contentDiv.className = "todo-content";

        // Create and append title
        const title = document.createElement("h4");
        title.textContent = todo.title;
        contentDiv.appendChild(title);

        // Create and append description if exists
        if (todo.description) {
          const description = document.createElement("p");
          description.textContent = todo.description;
          contentDiv.appendChild(description);
        }

        // Create and append due date if exists
        if (todo.due_date) {
          const dueDate = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = "Due: ";
          dueDate.appendChild(strong);
          dueDate.appendChild(
            document.createTextNode(
              new Date(todo.due_date).toLocaleDateString("en-US")
            )
          );
          contentDiv.appendChild(dueDate);
        }

        // Create actions div
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "todo-actions";

        // Create toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "toggle-btn";
        toggleBtn.setAttribute("data-id", todo.id);
        toggleBtn.setAttribute("data-completed", todo.completed);
        toggleBtn.textContent = todo.completed
          ? "Mark Incomplete"
          : "Mark Complete";
        actionsDiv.appendChild(toggleBtn);

        // Create delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-todo-btn";
        deleteBtn.setAttribute("data-id", todo.id);
        deleteBtn.textContent = "Delete";
        actionsDiv.appendChild(deleteBtn);

        // Append both divs to card
        todoCard.appendChild(contentDiv);
        todoCard.appendChild(actionsDiv);
        todosList.appendChild(todoCard);
      });

      // Add event listeners
      document.querySelectorAll(".toggle-btn").forEach((button) => {
        button.addEventListener("click", handleToggleTodo);
      });

      document.querySelectorAll(".delete-todo-btn").forEach((button) => {
        button.addEventListener("click", handleDeleteTodo);
      });
    } catch (error) {
      todosList.innerHTML = "<p>Failed to load tasks. Please try again later.</p>";
      console.error("Error fetching todos:", error);
    }
  }

  // Handle todo form submission
  todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("todo-email").value;
    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;
    const dueDate = document.getElementById("todo-due-date").value;

    try {
      const response = await fetch("/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          description: description,
          due_date: dueDate || null,
          student_email: email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        todoMessageDiv.textContent = "Task added successfully!";
        todoMessageDiv.className = "success";
        
        // Clear form fields except email
        document.getElementById("todo-title").value = "";
        document.getElementById("todo-description").value = "";
        document.getElementById("todo-due-date").value = "";

        // Refresh todos list
        currentTodoEmail = email;
        fetchTodos(email);
      } else {
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
      }

      todoMessageDiv.classList.remove("hidden");
      setTimeout(() => {
        todoMessageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      todoMessageDiv.textContent = "Failed to add task. Please try again.";
      todoMessageDiv.className = "error";
      todoMessageDiv.classList.remove("hidden");
      console.error("Error adding todo:", error);
    }
  });

  // Handle toggle todo completion
  async function handleToggleTodo(event) {
    const button = event.target;
    const todoId = parseInt(button.getAttribute("data-id"));
    const currentCompleted = button.getAttribute("data-completed") === "true";

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !currentCompleted,
        }),
      });

      if (response.ok) {
        fetchTodos(currentTodoEmail);
      } else {
        const result = await response.json();
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
        todoMessageDiv.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  }

  // Handle delete todo
  async function handleDeleteTodo(event) {
    const button = event.target;
    const todoId = parseInt(button.getAttribute("data-id"));

    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        todoMessageDiv.textContent = "Task deleted successfully!";
        todoMessageDiv.className = "success";
        todoMessageDiv.classList.remove("hidden");
        
        fetchTodos(currentTodoEmail);

        setTimeout(() => {
          todoMessageDiv.classList.add("hidden");
        }, 3000);
      } else {
        const result = await response.json();
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
        todoMessageDiv.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  // Watch todo email field for changes to auto-load todos
  document.getElementById("todo-email").addEventListener("blur", (event) => {
    const email = event.target.value;
    if (email) {
      currentTodoEmail = email;
      fetchTodos(email);
    }
  });

  // Initialize app
  fetchActivities();
});
