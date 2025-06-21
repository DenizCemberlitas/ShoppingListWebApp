
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const form = document.getElementById("itemForm");
  const input = document.getElementById("itemInput");
  const categorySelect = document.getElementById("itemCategory");
  const storeSelect = document.getElementById("itemStore");
  const list = document.getElementById("itemList");
  const clearBtn = document.getElementById("clearAllBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");

  let items = [];
  let initialized = false;

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      list.innerHTML = "";
    }).catch((error) => {
      console.error("Fehler beim Logout:", error);
    });
  });

  firebase.auth().onAuthStateChanged(user => {
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

  loginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => firebase.auth().signInWithPopup(provider))
      .then(() => {
        loginBtn.style.display = "none";
        initSharedList();
      })
      .catch(error => {
        console.error("Login fehlgeschlagen:", error);
        alert("Login fehlgeschlagen: " + error.message);
      });
  });

  function initSharedList() {
    if (initialized) return;
    initialized = true;

    const listRef = firebase.firestore()
      .collection("lists")
      .doc("familie")
      .collection("items");

    listRef.orderBy("timestamp").onSnapshot(snapshot => {
      items = [];
      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id });
      });
      renderItems(listRef);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      const category = categorySelect.value;
      const store = storeSelect.value;
      if (text && category && store) {
        listRef.add({
          text,
          category,
          store,
          checked: false,
          timestamp: Date.now()
        });
        input.value = "";
        categorySelect.value = "";
        storeSelect.value = "";
      }
    });

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
      if (!grouped[item.store]) grouped[item.store] = {};
      if (!grouped[item.store][item.category]) grouped[item.store][item.category] = [];
      grouped[item.store][item.category].push(item);
    });

    Object.keys(grouped).forEach(store => {
      const storeHeader = document.createElement("h2");
      storeHeader.textContent = "🏬 " + store;
      list.appendChild(storeHeader);

      const categories = grouped[store];
      Object.keys(categories).forEach(category => {
        const categoryHeader = document.createElement("h3");
        categoryHeader.textContent = getCategoryEmoji(category) + " " + category;
        list.appendChild(categoryHeader);

        const ul = document.createElement("ul");

        categories[category].forEach(item => {
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
    });
  }

  function getCategoryEmoji(category) {
    switch (category) {
      case "Getränke": return "🥤";
      case "Snacks": return "🥨";
      case "Tiefkühl": return "🧊";
      case "Tabakwaren": return "🚬";
      case "Tabak Zubehör": return "🚬";
      case "Sonstiges": return "🧺";
      default: return "🛒";
    }
  }
});
