const container = document.getElementById('container-2');
const fileInput = document.getElementById('file');
const productNameInput = document.getElementById('productName');
const priceInput = document.getElementById('price');
const searchInput = document.getElementById('searchInput');

let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveProducts() {
  localStorage.setItem('products', JSON.stringify(products));
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

async function addProduct() {
  const file = fileInput.files[0];
  const name = productNameInput.value.trim();
  const price = parseFloat(priceInput.value);

  if (!file || !name || isNaN(price) || price <= 0) {
    alert('يرجى إدخال كل الحقول بشكل صحيح.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Produkt');
  formData.append('folder', 'Produkten');

  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/dwalfzmb0/image/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.secure_url) {
      products.push({ name, price, imageUrl: data.secure_url });
      saveProducts();
      renderProducts();

      fileInput.value = '';
      productNameInput.value = '';
      priceInput.value = '';
    } else {
      alert('فشل رفع الصورة إلى Cloudinary');
    }
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء رفع الصورة');
  }
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  container.innerHTML = '';
  products
    .filter(p => p.name.toLowerCase().includes(searchTerm))
    .forEach((product, index) => {
      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>السعر: €${product.price.toFixed(2)}</p>
        <div class="buttons">
          <button class="small-btn" onclick="deleteProduct(${index})">حذف</button>
          <button class="small-btn" onclick="editPrice(${index})">تغيير السعر</button>
          <button class="small-btn" onclick="addToCart(${index})">إضافة إلى السلة</button>
        </div>`;
      container.appendChild(div);
    });
}

function deleteProduct(index) {
  if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
    products.splice(index, 1);
    saveProducts();
    renderProducts();
  }
}

function editPrice(index) {
  const newPrice = prompt('أدخل السعر الجديد:', products[index].price);
  if (newPrice !== null) {
    const p = parseFloat(newPrice);
    if (!isNaN(p) && p > 0) {
      products[index].price = p;
      saveProducts();
      renderProducts();
    } else {
      alert('السعر غير صالح.');
    }
  }
}

function addToCart(index) {
  const product = products[index];
  const cartItem = cart.find(item => item.name === product.name);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  alert(`تمت إضافة ${product.name} إلى السلة`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

function increaseQuantity(index) {
  cart[index].quantity++;
  saveCart();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1);
  }
  saveCart();
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const totalPriceEl = document.getElementById('total-price');

  if (!cartItems || !cartCount || !totalPriceEl) return;

  cartItems.innerHTML = '';
  let total = 0;
  let totalQuantity = 0;

  cart.forEach((item, i) => {
    const p = document.createElement('p');
    p.innerHTML = `
      ${item.name} - €${item.price.toFixed(2)} × ${item.quantity} = €${(item.price * item.quantity).toFixed(2)}
      <button onclick="removeFromCart(${i})">❌</button>
      <button onclick="increaseQuantity(${i})">＋</button>
      <button onclick="decreaseQuantity(${i})">－</button>`;
    cartItems.appendChild(p);
    total += item.price * item.quantity;
    totalQuantity += item.quantity;
  });

  totalPriceEl.textContent = `السعر النهائي: €${total.toFixed(2)}`;
  cartCount.textContent = totalQuantity;
}

function toggleCart() {
  const cartDiv = document.getElementById('cart');
  cartDiv.style.display = cartDiv.style.display === 'block' ? 'none' : 'block';
}

renderProducts();
updateCartDisplay();
