document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // ToDo elements
  const todosList = document.getElementById("todos-list");
  const todoForm = document.getElementById("todo-form");
  const todoMessageDiv = document.getElementById("todo-message");

  // Function to fetch todos from API
  async function fetchTodos() {
    try {
      const response = await fetch("/todos");
      const todos = await response.json();

      // Clear loading message
      todosList.innerHTML = "";

      // Check if there are any todos
      const todoArray = Object.values(todos);
      if (todoArray.length === 0) {
        todosList.innerHTML = "<p><em>No tasks yet. Add one above!</em></p>";
        return;
      }

      // Create todo items
      todoArray.forEach((todo) => {
        const todoItem = document.createElement("div");
        todoItem.className = `todo-item ${todo.completed ? "completed" : ""}`;

        todoItem.innerHTML = `
          <div class="todo-content">
            <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${
          todo.completed ? "checked" : ""
        } />
            <div class="todo-text">
              <h5>${todo.title}</h5>
              ${todo.description ? `<p>${todo.description}</p>` : ""}
            </div>
          </div>
          <button class="delete-todo-btn" data-id="${todo.id}">❌</button>
        `;

        todosList.appendChild(todoItem);
      });

      // Add event listeners to checkboxes
      document.querySelectorAll(".todo-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", handleToggleTodo);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-todo-btn").forEach((button) => {
        button.addEventListener("click", handleDeleteTodo);
      });
    } catch (error) {
      todosList.innerHTML =
        "<p>Failed to load todos. Please try again later.</p>";
      console.error("Error fetching todos:", error);
    }
  }

  // Handle todo form submission
  todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-description").value;

    try {
      const response = await fetch("/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          description: description,
          completed: false,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        todoMessageDiv.textContent = "Task added successfully!";
        todoMessageDiv.className = "success";
        todoForm.reset();

        // Refresh todos list
        fetchTodos();
      } else {
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
      }

      todoMessageDiv.classList.remove("hidden");

      // Hide message after 3 seconds
      setTimeout(() => {
        todoMessageDiv.classList.add("hidden");
      }, 3000);
    } catch (error) {
      todoMessageDiv.textContent = "Failed to add task. Please try again.";
      todoMessageDiv.className = "error";
      todoMessageDiv.classList.remove("hidden");
      console.error("Error adding todo:", error);
    }
  });

  // Handle toggle todo
  async function handleToggleTodo(event) {
    const checkbox = event.target;
    const todoId = checkbox.getAttribute("data-id");
    const completed = checkbox.checked;

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: completed,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh todos list to update UI
        fetchTodos();
      } else {
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
        todoMessageDiv.classList.remove("hidden");
      }
    } catch (error) {
      todoMessageDiv.textContent = "Failed to update task. Please try again.";
      todoMessageDiv.className = "error";
      todoMessageDiv.classList.remove("hidden");
      console.error("Error updating todo:", error);
    }
  }

  // Handle delete todo
  async function handleDeleteTodo(event) {
    const button = event.target;
    const todoId = button.getAttribute("data-id");

    try {
      const response = await fetch(`/todos/${todoId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        todoMessageDiv.textContent = result.message;
        todoMessageDiv.className = "success";

        // Refresh todos list
        fetchTodos();
      } else {
        todoMessageDiv.textContent = result.detail || "An error occurred";
        todoMessageDiv.className = "error";
      }

      todoMessageDiv.classList.remove("hidden");

      // Hide message after 3 seconds
      setTimeout(() => {
        todoMessageDiv.classList.add("hidden");
      }, 3000);
    } catch (error) {
      todoMessageDiv.textContent = "Failed to delete task. Please try again.";
      todoMessageDiv.className = "error";
      todoMessageDiv.classList.remove("hidden");
      console.error("Error deleting todo:", error);
    }
  }

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

  // Initialize app
  fetchTodos();
  fetchActivities();
});
