
class Task {
  constructor(id, task, completed, dateCompleted) {
    this.id = id;
    this.name = task;
    this.completed = completed;
    this.dateCompleted = dateCompleted ? new Date(dateCompleted) : null;
  }
}


class StorageService {
  constructor() {
    this.db = firebase.firestore();
    this.tasks = [];
    // this.populateTasks();
  }

  async readFirestore() {
    let tasks = [];

    try {
      const fireData = await this.db.collection('tasks').get();

      for (let doc of fireData.docs) {
        const data = doc.data();

        const task = new Task(
          doc.id, 
          data.name, 
          data.completed, 
          data.dateCompleted ? data.dateCompleted.toDate() : null
          );

        tasks.push(task);
      }
    } catch (err) {
      console.log(task);
    }

    console.log(tasks);

    this.tasks = tasks;
  }

  async addTask(task) {

    this.tasks.push(task);

    try {
      
      const docRef = await this.db.collection('tasks').add({
        name: task.name,
        completed: task.completed,
        dateCompleted: task.dateCompleted

      });

      console.log(docRef);

    } catch (err) {
      console.log(err);
    }
    

    this.saveTasks()
  }

  async updateTask(task) {

    try {
      await this.db.collection('tasks').doc(task.id).update({
        name: task.name,
        completed: task.completed,
        dateCompleted: task.dateCompleted

      });
      
      this.tasks = this.tasks.map(x => {
        return x.id == task.id ? task : x;
      });
    } catch (err) {
      console.log(err);
    }

    
  }

  async removeTask(id) {

    try {
      await this.db.collection('tasks').doc(id).delete();
      this.tasks = this.tasks.filter(x => x.id != id);
    } catch(err) {
      console.log(err)
    }
    // this.db.collection('tasks').doc(task.id).delete().then(function() {
    //   this.tasks = this.tasks.filter(x => x.id != uuid);
    //   this.saveTasks();
    //   console.log("task deleted");
    //   }).catch(function(error) {
    //     console.log(error)
    //   });
    // 
    // this.saveTasks()
  }

  saveTasks() {
    const tasksAsString = JSON.stringify(this.tasks);
    localStorage.setItem('tasks', tasksAsString);
  }
}

class UserInterface {
  constructor() {
    this.storage = new StorageService();
    this.table = document.getElementById('table-body');
    this.taskInput = document.getElementById('task-input');
  }

  async initialize() {
    this.initializeFormSubmitListener();

    await this.storage.readFirestore();

    this.populateTasksTable();
  }

  initializeFormSubmitListener() {
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();

      this.createTaskFromInput();
      this.clearFormInputs();
      
    });
  }

  async createTaskFromInput() {
    const taskName = this.taskInput.value;

    const task = new Task(null, taskName, false, null);

    await this.storage.addTask(task);

    this.populateTasksTable();
  }

  populateTasksTable() {
    this.clearTable();

    for (const task of this.storage.tasks) {
      this.addTaskToTable(task);
    }
  }

  clearTable() {
    let length = this.table.children.length;
    for (let i = 0; i < length; i++) {
      const row = this.table.children[0];
      row.remove();
    }
  }

  addTaskToTable(task) {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${task.name}</td>
      <td>${this.getCompleteIconHtml(task)}</td>
      <td>${this.formatDate(task.dateCompleted)}</td>
      <td>
        <i id="delete-${task.id}" class="bi bi-trash pointer"></i>
      </td>
    `;

    this.table.append(row);
    this.addCompleteTaskListenerToRow(task);
    this.addDeleteListenerToRow(task);
  }

  getCompleteIconHtml(task) {
    if (task.completed) {
      return `<i id="complete-${task.id}" class="bi bi-circle-fill green pointer"></i>`
    } else {
      return `<i id="complete-${task.id}" class="bi bi-circle-fill red pointer"></i>`
    }
  }

  formatDate(date) {
    if (!date) { return ''; }

    let year = date.getFullYear();
    let month = (date.getMonth() + 1 + '').padStart(2, '0');
    let day = (date.getDay() + '').padStart(2, '0');

    return `${month}/${day}/${year}`;
  }

  addCompleteTaskListenerToRow(task) {
    document.getElementById('complete-' + task.id).addEventListener('click', async () => {
      task.completed = !task.completed;
      task.dateCompleted = task.completed ? new Date() : null;
      await this.storage.updateTask(task);
      this.populateTasksTable();
    })
  }

  addDeleteListenerToRow(task) {
    document.getElementById('delete-' + task.id).addEventListener('click', async () => {
      await this.storage.removeTask(task.id);
      this.populateTasksTable();
    })
  }

  clearFormInputs() {
    this.taskInput.value = '';
  }
}

var ui = new UserInterface();
document.addEventListener('DOMContentLoaded', () => {
  ui.initialize();
});
