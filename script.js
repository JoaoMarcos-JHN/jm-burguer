let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartButtons = document.querySelectorAll('.add-to-card-btn');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartModal = document.getElementById('cart-modal');
const cartBtn = document.getElementById('cart-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cartTotal = document.getElementById('cart-total');
const addressInput = document.getElementById('address');
const addressWarn = document.getElementById('address-warn');
const checkoutBtn = document.getElementById('checkout-btn');

// Se tiver endereço salvo, pré-carrega
addressInput.value = localStorage.getItem('address') || '';

// Toast bonito com Tailwind
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white font-medium px-4 py-2 rounded shadow-lg z-[999] transition-all duration-300 opacity-0';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.remove('opacity-0'), 10);
  setTimeout(() => toast.remove(), 2500);
}

// Atualiza contador no footer
function updateCartCount() {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Adiciona item ao carrinho
cartButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name.trim();
    const price = parseFloat(btn.dataset.price.replace('R$', '').replace(',', '.'));
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ name, price, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Item adicionado ao carrinho ✅');

    // animação no ícone
    const iconSpan = btn.querySelector('.cart-icon-animation');
    iconSpan.classList.add('animate-bump');
    setTimeout(() => iconSpan.classList.remove('animate-bump'), 300);
  });
});

// Renderiza carrinho completo
function renderCart() {
  cartItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex justify-between items-center mb-2 border-b pb-2';

    const itemInfo = document.createElement('p');
    itemInfo.textContent = `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`;

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Remover';
    removeBtn.className = 'text-red-500 hover:text-red-700 text-sm flex items-center gap-1';
    removeBtn.onclick = () => {
      if (confirm('Remover este item do carrinho?')) {
        removeItem(index);
      }
    };

    itemDiv.appendChild(itemInfo);
    itemDiv.appendChild(removeBtn);
    cartItemsContainer.appendChild(itemDiv);

    total += item.price * item.quantity;
  });

  cartTotal.textContent = total.toFixed(2).replace('.', ',');
}

// Remover item individual
function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// Botão ver carrinho
cartBtn.addEventListener('click', () => {
  renderCart();
  cartModal.classList.remove('hidden');
  cartModal.classList.add('flex');

  const modalContent = cartModal.querySelector('div');
  modalContent.classList.add('scale-95', 'opacity-0');
  setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);
});

// Botão fechar modal
closeModalBtn.addEventListener('click', () => {
  cartModal.classList.add('hidden');
});

// Botão limpar carrinho
document.getElementById('clear-cart').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    renderCart();
  }
});

// Finalizar pedido
checkoutBtn.addEventListener('click', () => {
  const payment = document.getElementById('payment-method').value;

  if (addressInput.value.trim() === '') {
    addressWarn.classList.remove('hidden');
    return;
  }

  addressWarn.classList.add('hidden');
  localStorage.setItem('address', addressInput.value.trim());

  alert(`✅ Pedido finalizado com sucesso!
📦 Endereço: ${addressInput.value}
💳 Pagamento: ${payment}
🛒 Total: R$ ${cartTotal.textContent}`);

  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();
  cartModal.classList.add('hidden');
  addressInput.value = '';
});

// Inicializa contagem no footer
updateCartCount();
