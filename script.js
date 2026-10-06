import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

/*
  ============================================================
  1) COLE A CONFIGURAÇÃO DO SEU FIREBASE AQUI
  ============================================================
  No Firebase Console:
  Configurações do projeto > Seus apps > Web app.
*/
const firebaseConfig = {
  apiKey: "AIzaSyAi8RJqtArujE5DfoaFvh6oDTqrXl6a244",
  authDomain: "lista-presentes-195ac.firebaseapp.com",
  projectId: "lista-presentes-195ac",
  storageBucket: "lista-presentes-195ac.firebasestorage.app",
  messagingSenderId: "100987371905",
  appId: "1:100987371905:web:e196cfcb74b497ee85a880"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/*
  ============================================================
  2) PERSONALIZE AQUI
  ============================================================
*/
const CONFIG = {
  title: "Nosso cantinho",
  subtitle: "Escolha um presente da nossa lista. Obrigado pelo carinho!",
  collection: "presentes",

  gifts: [
    { id: "01", name: "Jogo de panelas", description: "Para a nossa cozinha", icon: "🍳" },
    { id: "02", name: "Jogo de toalhas", description: "Toalhas de banho", icon: "🛁" },
    { id: "03", name: "Taças de vinho", description: "Para brindar juntos", icon: "🍷" },
    { id: "04", name: "Jogo de cama", description: "Para o quarto", icon: "🛏️" },
    { id: "05", name: "Liquidificador", description: "", icon: "🥤" },
    { id: "06", name: "Cafeteira", description: "", icon: "☕" },
    { id: "07", name: "Vale-presente", description: "", icon: "🎁" }
  ]
};

document.title = CONFIG.title;
document.querySelector("#title").textContent = CONFIG.title;
document.querySelector("#subtitle").textContent = CONFIG.subtitle;

const list = document.querySelector("#gift-list");
const statusBox = document.querySelector("#status");
const dialog = document.querySelector("#confirm-dialog");
const selectedName = document.querySelector("#selected-name");
const confirmBtn = document.querySelector("#confirm-btn");

let selectedGift = null;
let reserved = new Set();

function render() {
  list.innerHTML = "";

  for (const gift of CONFIG.gifts) {
    const isReserved = reserved.has(gift.id);

    const card = document.createElement("article");
    card.className = "gift";

    const icon = document.createElement("div");
    icon.className = "gift-icon";
    icon.textContent = gift.icon || "🎁";

    const info = document.createElement("div");
    info.className = "gift-info";

    const name = document.createElement("h2");
    name.className = "gift-name";
    name.textContent = gift.name;

    info.appendChild(name);

    if (gift.description) {
      const description = document.createElement("div");
      description.className = "gift-description";
      description.textContent = gift.description;
      info.appendChild(description);
    }

    const button = document.createElement("button");
    button.className = "reserve";
    button.disabled = isReserved;
    button.textContent = isReserved ? "Já escolhido" : "Vou dar este";

    if (!isReserved) {
      button.addEventListener("click", () => openConfirmation(gift));
    }

    card.append(icon, info, button);
    list.appendChild(card);
  }
}

function openConfirmation(gift) {
  selectedGift = gift;
  selectedName.textContent = gift.name;
  dialog.showModal();
}

function closeDialog() {
  selectedGift = null;
  dialog.close();
}

document.querySelector("#cancel-btn").addEventListener("click", closeDialog);
document.querySelector("#close-dialog").addEventListener("click", closeDialog);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

confirmBtn.addEventListener("click", async () => {
  if (!selectedGift) return;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Reservando...";

  try {
    const giftRef = doc(db, CONFIG.collection, selectedGift.id);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(giftRef);

      if (snapshot.exists() && snapshot.data().reserved === true) {
        throw new Error("ALREADY_RESERVED");
      }

      transaction.set(giftRef, {
        name: selectedGift.name,
        reserved: true,
        reservedAt: serverTimestamp()
      }, { merge: true });
    });

    closeDialog();
    showStatus("Presente reservado! Obrigado pelo carinho.");
  } catch (error) {
    if (error.message === "ALREADY_RESERVED") {
      showStatus("Esse presente acabou de ser escolhido por outra pessoa. Escolha outro da lista.");
    } else {
      console.error(error);
      showStatus("Não foi possível reservar agora. Verifique sua conexão e tente novamente.");
    }
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirmar";
  }
});

function showStatus(message) {
  statusBox.textContent = message;
  statusBox.hidden = false;
  setTimeout(() => statusBox.hidden = true, 5000);
}

const giftsRef = collection(db, CONFIG.collection);

onSnapshot(giftsRef, (snapshot) => {
  reserved = new Set(
    snapshot.docs
      .filter(d => d.data().reserved === true)
      .map(d => d.id)
  );
  render();
}, (error) => {
  console.error(error);
  showStatus("Não foi possível carregar a lista. Confira a configuração do Firebase.");
});

render();
