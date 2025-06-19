document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");
  const form = document.getElementById("itemForm");
  const input = document.getElementById("itemInput");
  const categorySelect = document.getElementById("itemCategory");
  const list = document.getElementById("itemList");
  const clearBtn = document.getElementById("clearAllBtn");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

  let items = [];
  let initialized = false;
  let firestoreListRef = null;

  // 🔁 Auth-Zustand prüfen
  firebase.auth().onAuthStateChanged(user => {
    initialized = false;

    if (user) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      userInfo.textContent = `👤 Eingeloggt als: ${user.displayName || user.email}`;
      initSharedList();
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      userInfo.textContent = "";
      list.innerHTML = "";
    }
  });

  // 🔐 Login mit Google
  loginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => firebase.auth().signInWithPopup(provider))
      .catch((error) => {
        console.error("Login fehlgeschlagen:", error);
        alert("Login fehlgeschlagen: " + error.message);
      });
  });

  // 🚪 Logout
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut()
      .then(() => {
        list.innerHTML = "";
      })
      .catch((error) => {
        console.error("Fehler beim Logout:", error);
      });
  });

  // 📥 Formularverhalten
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    const category = categorySelect.value;

    if (text && category && firestoreListRef) {
      firestoreListRef.add({
        text,
        category,
        checked: false,
        timestamp: Date.now()
      });
      input.value = "";
      categorySelect.value = "";
    }
  });

  // 🗑️ Alles löschen
  clearBtn.addEventListener("click", () => {
    if (firestoreListRef && confirm("Wirklich alles löschen?")) {
      items.forEach(item => {
        firestoreListRef.doc(item.id).delete();
      });
    }
  });

  // 📡 Firestore-Daten laden
  function initSharedList() {
    if (initialized) return;
    initialized = true;

    firestoreListRef = firebase.firestore()
      .collection("lists")
      .doc("familie")
      .collection("items");

    firestoreListRef.orderBy("timestamp").onSnapshot(snapshot => {
      items = [];

      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id });
      });

      console.log("📦 Geladene Items:", items);
      renderItems();
    });
  }

  // 🖼️ Liste anzeigen
  function renderItems() {
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
          firestoreListRef.doc(item.id).update({ checked: !item.checked });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          firestoreListRef.doc(item.id).delete();
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
      });

      list.appendChild(ul);
    });
  }

  document.addEventListener("click", (e) => {
  if (
    sidebar.classList.contains("active") &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove("active");
  }
});


  // 🧠 Emoji je Kategorie
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
