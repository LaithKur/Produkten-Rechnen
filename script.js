const container = document.getElementById('container-2');
const fileInput = document.getElementById('file');
const productNameInput = document.getElementById('productName');
const priceInput = document.getElementById('price');
const searchInput = document.getElementById('searchInput');

// قراءة المنتجات من localStorage بطريقة آمنة
let products = [];
const productsData = localStorage.getItem('products');
if (productsData) {
  try {
    products = JSON.parse(productsData);
  } catch (e) {
    console.error('خطأ في قراءة بيانات المنتجات من localStorage:', e);
    products = [];
  }
}

let cart = [];
const cartContainer = document.createElement('div');
cartContainer.id = 'cart';
cartContainer.style.position = 'fixed';
cartContainer.style.top = '50px';
cartContainer.style.left = '10px';
cartContainer.style.width = '300px';
cartContainer.style.maxHeight = '80vh';
cartContainer.style.overflowY = 'auto';
cartContainer.style.backgroundColor = '#fff';
cartContainer.style.border = '1px solid #ccc';
cartContainer.style.padding = '10px';
cartContainer.style.display = 'none';
document.body.appendChild(cartContainer);

const cartButton = document.createElement('button');
cartButton.textContent = '🛒 السلة';
cartButton.style.position = 'fixed';
cartButton.style.top = '10px';
cartButton.style.left = '10px';
cartButton.style.padding = '10px 15px';
cartButton.style.fontSize = '18px';
document.body.appendChild(cartButton);

cartButton.addEventListener('click', () => {
  if (cartContainer.style.display === 'none') {
    renderCart();
    cartContainer.style.display = 'block';
  } else {
    cartContainer.style.display = 'none';
  }
});

function saveProducts() {
  localStorage.setItem('products', JSON.stringify(products));
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addProductToCart(index) {
  const product = products[index];
  const existingItem = cart.find(item => item.name === product.name);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function changeQuantity(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity < 1) {
    removeFromCart(index);
  } else {
    saveCart();
    renderCart();
  }
}

function renderCart() {
  cartContainer.innerHTML = '<h3>سلة المشتريات</h3>';
  if (cart.length === 0) {
    cartContainer.innerHTML += '<p>السلة فارغة</p>';
    return;
  }
  cart.forEach((item, index) => {
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid #ddd';
    div.style.padding = '5px 0';

    div.innerHTML = `
      <strong>${item.name}</strong> - €${item.price.toFixed(2)} x ${item.quantity}
      = €${(item.price * item.quantity).toFixed(2)}
      <br/>
      <button onclick="changeQuantity(${index}, 1)">+</button>
      <button onclick="changeQuantity(${index}, -1)">-</button>
      <button onclick="removeFromCart(${index})">حذف</button>
    `;
    cartContainer.appendChild(div);
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiv = document.createElement('div');
  totalDiv.style.fontWeight = 'bold';
  totalDiv.style.marginTop = '10px';
  totalDiv.textContent = `السعر النهائي: €${total.toFixed(2)}`;
  cartContainer.appendChild(totalDiv);
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
  formData.append('image', file);

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'خطأ في رفع الصورة');

    products.push({ name, price, imageUrl: data.imageUrl });
    saveProducts();
    renderProducts();

    fileInput.value = '';
    productNameInput.value = '';
    priceInput.value = '';
  } catch (err) {
    alert(err.message);
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
          <button class="small-btn" onclick="addProductToCart(${index})">أضف إلى السلة</button>
        </div>
      `;

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

// قراءة العربة من localStorage
const cartData = localStorage.getItem('cart');
if (cartData) {
  try {
    cart = JSON.parse(cartData);
  } catch (e) {
    console.error('خطأ في قراءة العربة من localStorage:', e);
    cart = [];
  }
}

renderProducts();
