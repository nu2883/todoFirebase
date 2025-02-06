const firebaseConfig = {
    apiKey: "AIzaSyDGrIdHB1NtgMl45R7Ljtm6oXRhPBrerJI",
    authDomain: "todo-123f0.firebaseapp.com",
    databaseURL: "https://todo-123f0-default-rtdb.firebaseio.com",
    projectId: "todo-123f0",
    storageBucket: "todo-123f0.firebasestorage.app",
    messagingSenderId: "936109013799",
    appId: "1:936109013799:web:755c636f66d898c9834702"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

new Vue({
    el: "#app",
    data: {
        user: null,
        email: "",
        password: "",
        newGroupTitle: "",
        todoGroups: [],
        showAllTodos: false,
        todoGroups: []
    },
    created() {
        auth.onAuthStateChanged(user => {
            this.user = user;
            if (user) {
                this.fetchTodoGroups();
            } else {
                this.todoGroups = [];
            }
        });
    },
    methods: {
        toggleAll() {
            // Logika untuk membuka/tutup semua accordion
            this.todoGroups.forEach(group => {
                const collapseElement = document.getElementById('collapse' + group.id);
                if (collapseElement.classList.contains('show')) {
                    collapseElement.classList.remove('show');
                } else {
                    collapseElement.classList.add('show');
                }
            });
        },
        toggleView() {
            this.showAllTodos = !this.showAllTodos;
        },
        async register() {
            await auth.createUserWithEmailAndPassword(this.email, this.password);
        },
        async login() {
            await auth.signInWithEmailAndPassword(this.email, this.password);
        },
        async logout() {
            await auth.signOut();
        },
        async fetchTodoGroups() {
            if (!this.user) return;
            const snapshot = await db.collection("todoGroups").where("userId", "==", this.user.uid).get();
            this.todoGroups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                todos: [],
                newTodo: ""
            }));
            this.todoGroups.forEach(group => this.fetchTodos(group));
        },
        async fetchTodos(group) {
            const snapshot = await db.collection("todos").where("groupId", "==", group.id).get();
            group.todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), editing: false }));
        },
        async addTodoGroup() {
            if (!this.newGroupTitle.trim() || !this.user) return;
            const docRef = await db.collection("todoGroups").add({
                title: this.newGroupTitle,
                userId: this.user.uid
            });
            this.todoGroups.push({
                id: docRef.id,
                title: this.newGroupTitle,
                todos: [],
                newTodo: ""
            });
            this.newGroupTitle = "";
        },
        async deleteTodoGroup(groupId) {
            if (confirm("Apakah Anda yakin ingin menghapus kelompok ini?")) {
                await db.collection("todoGroups").doc(groupId).delete();
                this.todoGroups = this.todoGroups.filter(group => group.id !== groupId);
            }
        },
        async addTodo(group) {
            if (!group.newTodo.trim() || !this.user) return;
            const docRef = await db.collection("todos").add({
                text: group.newTodo,
                groupId: group.id,
                userId: this.user.uid
            });
            group.todos.push({ id: docRef.id, text: group.newTodo, editing: false });
            group.newTodo = "";
        },
        editTodo(todo) {
            todo.editing = true;
        },
        async saveTodo(todo) {
            if (!todo.text.trim()) return;
            await db.collection("todos").doc(todo.id).update({ text: todo.text });
            todo.editing = false;
        },
        async confirmDelete(todoId) {
            if (confirm("Apakah Anda yakin ingin menghapus todo ini?")) {
                await db.collection("todos").doc(todoId).delete();
                this.todoGroups.forEach(group => {
                    group.todos = group.todos.filter(todo => todo.id !== todoId);
                });
            }
        }
    }
});