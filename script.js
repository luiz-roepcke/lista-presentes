import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

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


// ============================================================
// CONFIGURAÇÃO DA LISTA
// ============================================================

const CONFIG = {
  title: "Nosso cantinho",

  subtitle:
    "Escolha um presente da nossa lista. Obrigado pelo carinho!",

  collection: "presentes",

  gifts: [
    {
      id: "01",
      name: "Roupas",
      description: "Vestidos e cropped/blusas — tamanho P",
      icon: "👗"
    },

    {
      id: "02",
      name: "Jeans",
      description: "Tamanho 36",
      icon: "👖"
    },

    {
      id: "03",
      name: "Tênis",
      description: "Tamanho 37",
      icon: "👟"
    },

    {
      id: "04",
      name: "Semijoias",
      description: "Colares, brincos e outros acessórios",
      icon: "💎"
    },

    {
      id: "05",
      name: "Perfumes e Body Splash",
      description: "Perfumes ou body splash",
      icon: "🌸"
    },

    {
      id: "06",
      name: "Maquiagem",
      description: "Itens de maquiagem",
      icon: "💄"
    },

    {
      id: "07",
      name: "Skincare",
      description: "Produtos para cuidados com a pele",
      icon: "🧴"
    },

    {
      id: "08",
      name: "Vale-compras Riachuelo ou C&A",
      description: "Vale-presente de qualquer valor",
      icon: "🎁"
    },

    {
      id: "09",
      name: "Vale-presente de livraria",
      description: "Vale-compras para uma livraria",
      icon: "📚"
    }
  ]
};


// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const titleElement = document.querySelector("#title");
const subtitleElement = document.querySelector("#subtitle");
const giftsContainer = document.querySelector("#gifts");
const statusElement = document.querySelector("#status");

const dialog = document.querySelector("#confirmDialog");
const dialogGiftName = document.querySelector("#dialogGiftName");
const confirmButton = document.querySelector("#confirmButton");
const cancelButton = document.querySelector("#cancelButton");


// ============================================================
// CONFIGURAÇÃO DO TÍTULO
// ============================================================

if (titleElement) {
  titleElement.textContent = CONFIG.title;
}

if (subtitleElement) {
  subtitleElement.textContent = CONFIG.subtitle;
}


// ============================================================
// PRESENTE SELECIONADO
// ============================================================

let selectedGift = null;


// ============================================================
// RENDERIZAÇÃO DOS PRESENTES
// ============================================================

function renderGifts(reservedGifts = {}) {
  if (!giftsContainer) {
    return;
  }

  giftsContainer.innerHTML = "";

  CONFIG.gifts.forEach((gift) => {
    const reserved = reservedGifts[gift.id] === true;

    const card = document.createElement("article");

    card.className = "gift-card";

    if (reserved) {
      card.classList.add("reserved");
    }

    card.innerHTML = `
      <div class="gift-icon">
        ${gift.icon}
      </div>

      <div class="gift-content">
        <h3>${gift.name}</h3>

        ${
          gift.description
            ? `<p>${gift.description}</p>`
            : ""
        }
      </div>

      <button
        class="gift-button"
        ${reserved ? "disabled" : ""}
        data-gift-id="${gift.id}"
      >
        ${reserved ? "Já escolhido" : "Vou dar este"}
      </button>
    `;

    const button = card.querySelector(".gift-button");

    if (!reserved) {
      button.addEventListener("click", () => {
        openConfirmation(gift);
      });
    }

    giftsContainer.appendChild(card);
  });
}


// ============================================================
// CONFIRMAÇÃO
// ============================================================

function openConfirmation(gift) {
  selectedGift = gift;

  if (dialogGiftName) {
    dialogGiftName.textContent = gift.name;
  }

  if (dialog) {
    dialog.showModal();
  }
}


function closeConfirmation() {
  selectedGift = null;

  if (dialog) {
    dialog.close();
  }
}


if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    closeConfirmation();
  });
}


// ============================================================
// RESERVAR PRESENTE
// ============================================================

if (confirmButton) {
  confirmButton.addEventListener("click", async () => {

    if (!selectedGift) {
      return;
    }

    const gift = selectedGift;

    confirmButton.disabled = true;
    confirmButton.textContent = "Reservando...";

    try {

      const giftRef = doc(
        db,
        CONFIG.collection,
        gift.id
      );

      await runTransaction(db, async (transaction) => {

        const snapshot = await transaction.get(giftRef);

        if (
          snapshot.exists() &&
          snapshot.data().reserved === true
        ) {
          throw new Error("ALREADY_RESERVED");
        }

        transaction.set(
          giftRef,
          {
            name: gift.name,
            reserved: true,
            reservedAt: serverTimestamp()
          },
          {
            merge: true
          }
        );

      });

      closeConfirmation();

      showStatus(
        "Presente reservado com sucesso!",
        "success"
      );

    } catch (error) {

      console.error(error);

      closeConfirmation();

      if (error.message === "ALREADY_RESERVED") {

        showStatus(
          "Esse presente acabou de ser escolhido por outra pessoa.",
          "error"
        );

      } else {

        showStatus(
          "Não foi possível reservar o presente. Tente novamente.",
          "error"
        );
      }

    } finally {

      confirmButton.disabled = false;
      confirmButton.textContent = "Confirmar";

    }
  });
}


// ============================================================
// STATUS
// ============================================================

function showStatus(message, type = "") {

  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;

  statusElement.className = "status";

  if (type) {
    statusElement.classList.add(type);
  }

  setTimeout(() => {

    statusElement.textContent = "";
    statusElement.className = "status";

  }, 5000);
}


// ============================================================
// FIRESTORE
// ============================================================

const giftsCollection = collection(
  db,
  CONFIG.collection
);

onSnapshot(
  giftsCollection,
  (snapshot) => {

    const reservedGifts = {};

    snapshot.forEach((document) => {

      const data = document.data();

      if (data.reserved === true) {
        reservedGifts[document.id] = true;
      }

    });

    renderGifts(reservedGifts);

  },

  (error) => {

    console.error(
      "Erro ao carregar presentes:",
      error
    );

    showStatus(
      "Não foi possível carregar a lista de presentes.",
      "error"
    );

  }
);


// ============================================================
// PIX
// ============================================================

const PIX_KEY = "pachecobeltrame@gmail.com";

function createPixSection() {

  const container = document.querySelector(".container");

  if (!container) {
    return;
  }

  const pixSection = document.createElement("section");

  pixSection.className = "pix-section";

  pixSection.innerHTML = `
    <div class="pix-icon">
      💰
    </div>

    <div class="pix-content">

      <h2>Presente via Pix</h2>

      <p>
        Se preferir, você também pode contribuir
        através do Pix.
      </p>

      <div class="pix-key">
        ${PIX_KEY}
      </div>

      <button
        type="button"
        id="copyPixButton"
        class="pix-button"
      >
        Copiar chave Pix
      </button>

      <div
        id="pixMessage"
        class="pix-message"
      ></div>

    </div>
  `;

  container.appendChild(pixSection);

  const copyButton =
    document.querySelector("#copyPixButton");

  const pixMessage =
    document.querySelector("#pixMessage");

  if (copyButton) {

    copyButton.addEventListener(
      "click",
      async () => {

        try {

          await navigator.clipboard.writeText(
            PIX_KEY
          );

          if (pixMessage) {
            pixMessage.textContent =
              "Chave Pix copiada!";
          }

          copyButton.textContent =
            "Chave copiada!";

          setTimeout(() => {

            copyButton.textContent =
              "Copiar chave Pix";

            if (pixMessage) {
              pixMessage.textContent = "";
            }

          }, 3000);

        } catch (error) {

          console.error(
            "Erro ao copiar chave Pix:",
            error
          );

          if (pixMessage) {
            pixMessage.textContent =
              "Não foi possível copiar automaticamente. Toque e segure a chave para copiar.";
          }

        }

      }
    );
  }
}


// ============================================================
// INICIALIZA PIX
// ============================================================

createPixSection();