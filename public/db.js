let db;
const request = indexedDB.open("budget", 1);

// Creates an object store called "pending" and sets autoIncrement to true
request.onupgradeneeded = function (event) {
    const db = event.target.result;

    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // Checks if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Error: " + event.target.errorCode);
};

// Adds a record to the "pending" object store with the add method
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");

    store.add(record);
}

// Clears all items in store if getAll is successful
function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");
    
    // Gets all records from store and sets them to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");

                    const store = transaction.objectStore("pending");

                    store.clear();
                });
        }
    };
}

// Listens for app coming back online
window.addEventListener("online", checkDatabase);