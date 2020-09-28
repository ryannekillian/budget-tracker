let db;
const request = indexedDB.open('badget_tracker', 1);

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    fetch("/api/transaction")
    .then(response => {
      return response.json();
    })
    .then(data => {
      transactions = data;
  
      populateTotal();
      populateTable();
      populateChart();
    });
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    transactionObjectStore.add(record);
}

function uploadTransactions() {

    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              const transaction = db.transaction(['new_transaction'], 'readwrite');
              const transactionObjectStore = transaction.objectStore('new_transaction');
              transactionObjectStore.clear();
            })
            .catch(err => {
              console.log(err);
            });
        }
    };
}
  
window.addEventListener('online', uploadTransactions);