import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// ========================================
// CONFIGURAÇÕES GERAIS
// ========================================
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

const CONFIG = {
  title: "Meus 15 Anos",
  subtitle: "Essas são sugestões carinhosas se você quiser me presentear. Mas o maior presente é ter você em minha festa.",
  collection: "presentes",

  gifts: [
    { id: "01", name: "Roupas", description: "Vestidos e cropped/blusas — tamanho P", icon: "👗" },
    { id: "02", name: "Jeans", description: "Tamanho 36", icon: "👖" },
    { id: "03", name: "Tênis", description: "Tamanho 37", icon: "👟" },
    { id: "04", name: "Semijoias", description: "Colares, brincos e outros acessórios", icon: "💎" },
    { id: "05", name: "Perfumes e Body Splash", description: "Perfumes ou body splash", icon: "🌸" },
    { id: "06", name: "Maquiagem", description: "Itens de maquiagem", icon: "💄" },
    { id: "07", name: "Skincare", description: "Produtos para cuidados com a pele", icon: "🧴" },
    { id: "08", name: "Vale-compras Riachuelo ou C&A", description: "Vale-presente de qualquer valor", icon: "🎁" },
    { id: "09", name: "Vale-presente de livraria", description: "Vale-compras para uma livraria", icon: "📚" }
  ]
};

// ========================================
// ELEMENTOS DO DOM
// ========================================
const titleElement = document.querySelector("#title");
const subtitleElement = document.querySelector("#subtitle");
const giftsContainer = document.querySelector("#gift-list");
const statusElement = document.querySelector("#status");
const dialog = document.querySelector("#confirm-dialog");
const dialogGiftName = document.querySelector("#selected-name");
const confirmButton = document.querySelector("#confirm-btn");
const closeButtons = document.querySelectorAll("#cancel-btn, #close-dialog");

if (titleElement) titleElement.textContent = CONFIG.title;
if (subtitleElement) subtitleElement.textContent = CONFIG.subtitle;

let selectedGift = null;

// ========================================
// RENDERIZAÇÃO DA LISTA
// ========================================
function renderGifts(giftCounts = {}) {
  if (!giftsContainer) return;
  
  giftsContainer.innerHTML = "";

  CONFIG.gifts.forEach((gift) => {
    const count = giftCounts[gift.id] || 0; 
    const card = document.createElement("article");
    card.className = "gift-card"; 

    // Se o contador for maior que 0, exibe a tag. Senão, não exibe nada extra.
    const counterHtml = count > 0 
      ? `<div class="gift-counter">${count} pessoa${count > 1 ? 's' : ''} já escolheu</div>` 
      : '';

    card.innerHTML = `
      <div class="gift-icon">${gift.icon}</div>
      <div class="gift-content">
        <h3>${gift.name}</h3>
        <p>${gift.description}</p>
        ${counterHtml}
      </div>
      <button class="gift-button">
        Vou dar este
      </button>
    `;

    const btn = card.querySelector(".gift-button");
    btn.addEventListener("click", () => openConfirmation(gift));

    giftsContainer.appendChild(card);
  });
}

// ========================================
// CONTROLE DO MODAL
// ========================================
function openConfirmation(gift) {
  selectedGift = gift;
  if (dialogGiftName) dialogGiftName.textContent = gift.name;
  if (dialog) dialog.showModal();
}

function closeConfirmation() {
  selectedGift = null;
  if (dialog) dialog.close();
}

closeButtons.forEach(btn => {
  btn.addEventListener("click", closeConfirmation);
});

// ========================================
// SALVAR NO FIRESTORE (INCREMENTO)
// ========================================
if (confirmButton) {
  confirmButton.addEventListener("click", async () => {
    if (!selectedGift) return;

    const gift = selectedGift;
    confirmButton.disabled = true;
    confirmButton.textContent = "Confirmando...";

    try {
      const giftRef = doc(db, CONFIG.collection, gift.id);

      // Ao invés de travar, adiciona +1 na contagem de forma atômica
      await setDoc(giftRef, {
        name: gift.name,
        count: increment(1),
        lastReservedAt: serverTimestamp()
      }, { merge: true });

      closeConfirmation();
      showStatus("Presente confirmado com sucesso! Obrigada!", "success");
    } catch (error) {
      console.error(error);
      closeConfirmation();
      showStatus("Não foi possível confirmar o presente. Tente novamente.", "error");
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = "Confirmar";
    }
  });
}

function showStatus(message, type = "") {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.hidden = false;

  setTimeout(() => {
    statusElement.hidden = true;
    statusElement.className = "status";
  }, 5000);
}

// ========================================
// INICIALIZAÇÃO & LISTENER EM TEMPO REAL
// ========================================
renderGifts({}); // Renderiza estado inicial

const giftsCollection = collection(db, CONFIG.collection);

onSnapshot(giftsCollection, (snapshot) => {
  const giftCounts = {};
  
  snapshot.forEach((document) => {
    const data = document.data();
    if (data.count && data.count > 0) {
      giftCounts[document.id] = data.count;
    }
  });
  
  renderGifts(giftCounts);
}, (error) => {
  console.error("Erro ao carregar os dados:", error);
});

// ========================================
// LÓGICA DO PIX
// ========================================
const copyPixBtn = document.querySelector("#copy-pix-btn");
const pixKeyText = document.querySelector("#pix-key-text");
const pixMessage = document.querySelector("#pix-message");

if (copyPixBtn && pixKeyText) {
  copyPixBtn.addEventListener("click", async () => {
    try {
      const key = pixKeyText.textContent;
      await navigator.clipboard.writeText(key);
      
      if (pixMessage) pixMessage.textContent = "Chave Pix copiada com sucesso!";
      copyPixBtn.textContent = "Copiado!";
      
      setTimeout(() => {
        copyPixBtn.textContent = "Copiar Chave";
        if (pixMessage) pixMessage.textContent = "";
      }, 3000);
    } catch (error) {
      console.error("Erro ao copiar Pix:", error);
      if (pixMessage) pixMessage.textContent = "Não foi possível copiar automaticamente.";
    }
  });
}