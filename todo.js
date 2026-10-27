const storageKey = "todo-app-tasks";
const taskList = document.getElementById("tasks");
const taskInput = document.getElementById("task-name");
const statusMessage = document.getElementById("status");
let tasks = [];
let nextId = 1;
let editingId = null;

function showStatus(message) {
    statusMessage.textContent = message;
}

function saveTasks() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks to local storage.", error);
        showStatus("Your changes are shown, but could not be saved in this browser.");
    }
}

function renderTasks() {
    taskList.replaceChildren();

    if (tasks.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No tasks yet. Add one above!";
        taskList.appendChild(emptyMessage);
        return;
    }

    for (const task of tasks) {
        const item = document.createElement("li");
        item.className = "task";
        item.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark "${task.text}" as complete`);
        checkbox.dataset.action = "toggle";
        item.appendChild(checkbox);

        if (editingId === task.id) {
            const editInput = document.createElement("input");
            editInput.className = "edit-input";
            editInput.type = "text";
            editInput.maxLength = 200;
            editInput.value = task.text;
            editInput.setAttribute("aria-label", "Edit task");
            editInput.dataset.action = "edit-input";
            item.appendChild(editInput);

            const saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.textContent = "Save";
            saveButton.dataset.action = "save";
            item.appendChild(saveButton);

            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "secondary";
            cancelButton.textContent = "Cancel";
            cancelButton.dataset.action = "cancel";
            item.appendChild(cancelButton);
        } else {
            const label = document.createElement("span");
            label.className = task.completed ? "task-label completed" : "task-label";
            label.textContent = task.text;
            item.appendChild(label);

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "secondary";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            item.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            item.appendChild(deleteButton);
        }

        taskList.appendChild(item);
    }

    if (editingId !== null) {
        const editInput = taskList.querySelector(".edit-input");
        editInput.focus();
        editInput.select();
    }
}

function updateTask(id, update) {
    tasks = tasks.map((task) => task.id === id ? { ...task, ...update } : task);
    saveTasks();
    renderTasks();
}

document.getElementById("add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) {
        showStatus("Enter a task before adding it.");
        taskInput.focus();
        return;
    }

    tasks.push({ id: nextId++, text, completed: false });
    saveTasks();
    renderTasks();
    taskInput.value = "";
    taskInput.focus();
    showStatus("Task added.");
});

taskList.addEventListener("change", (event) => {
    if (event.target.dataset.action !== "toggle") return;
    const id = Number(event.target.closest(".task").dataset.id);
    updateTask(id, { completed: event.target.checked });
    showStatus(event.target.checked ? "Task completed." : "Task marked as active.");
});

taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const item = button.closest(".task");
    const id = Number(item.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        editingId = id;
        renderTasks();
    } else if (action === "cancel") {
        editingId = null;
        renderTasks();
    } else if (action === "save") {
        const text = item.querySelector(".edit-input").value.trim();
        if (!text) {
            showStatus("A task cannot be empty.");
            item.querySelector(".edit-input").focus();
            return;
        }
        editingId = null;
        updateTask(id, { text });
        showStatus("Task updated.");
    } else if (action === "delete") {
        tasks = tasks.filter((task) => task.id !== id);
        if (editingId === id) editingId = null;
        saveTasks();
        renderTasks();
        showStatus("Task deleted.");
    }
});

taskList.addEventListener("keydown", (event) => {
    if (event.target.dataset.action !== "edit-input") return;
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.closest(".task").querySelector('[data-action="save"]').click();
    } else if (event.key === "Escape") {
        editingId = null;
        renderTasks();
    }
});

try {
    const storedTasks = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(storedTasks) || storedTasks.some((task) =>
        !task || !Number.isInteger(task.id) || typeof task.text !== "string" ||
        typeof task.completed !== "boolean"
    )) {
        throw new Error("Saved task data has an invalid format.");
    }
    tasks = storedTasks;
    nextId = Math.max(0, ...tasks.map((task) => task.id)) + 1;
} catch (error) {
    console.error("Could not load saved tasks.", error);
    showStatus("Saved tasks could not be loaded. Add a task to get started.");
}

renderTasks();
