document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const form = document.getElementById("itemForm");
  const input = document.getElementById("itemInput");
  const categorySelect = document.getElementById("itemCategory");
  const list = document.getElementById("itemList");
  const clearBtn = document.getElementById("clearAllBtn");

  let items = [];

  firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loginBtn.style.display = "none";
    initSharedList();
  } else {
    loginBtn.style.display = "inline-block";
  }
});


  loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      return firebase.auth().signInWithPopup(provider);
    })
    .then((result) => {
      loginBtn.style.display = "none";
      initSharedList();
    })
    .catch((error) => {
      console.error("Login fehlgeschlagen:", error);
      alert("Login fehlgeschlagen: " + error.message);
    });
});


  function initSharedList() {
    const listRef = firebase.firestore()
      .collection("lists")
      .doc("familie")
      .collection("items");

    // Echtzeit-Updates
    listRef.orderBy("timestamp").onSnapshot(snapshot => {
      items = [];
      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id });
      });
      renderItems(listRef);
    });

    // Hinzufügen
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      const category = categorySelect.value;

      if (text && category) {
        listRef.add({
          text,
          category,
          checked: false,
          timestamp: Date.now()
        });
        input.value = "";
        categorySelect.value = "";
      }
    });

    // Alle löschen
    clearBtn.addEventListener("click", () => {
      if (confirm("Wirklich alles löschen?")) {
        items.forEach(item => {
          listRef.doc(item.id).delete();
        });
      }
    });
  }

  function renderItems(listRef) {
    list.innerHTML = "";

    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    Object.keys(grouped).forEach(category => {
      const categoryHeader = document.createElement("h2");
      categoryHeader.textContent = getCategoryEmoji(category) + " " + category;
      list.appendChild(categoryHeader);

      const ul = document.createElement("ul");

      grouped[category].forEach(item => {
        const li = document.createElement("li");
        if (item.checked) li.classList.add("checked");

        const span = document.createElement("span");
        span.textContent = item.text;
        span.addEventListener("click", () => {
          listRef.doc(item.id).update({ checked: !item.checked });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          listRef.doc(item.id).delete();
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
      });

      list.appendChild(ul);
    });
  }

  function getCategoryEmoji(category) {
    switch (category) {
      case "Obst": return "🍎";
      case "Getränke": return "🥤";
      case "Haushalt": return "🧼";
      case "Snacks": return "🥨";
      case "Tiefkühl": return "🧊";
      case "Tabakwaren": return "🚬";
      case "Sonstiges": return "🧺";
      default: return "🛒";
    }
  }
});
