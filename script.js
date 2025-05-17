const firebaseConfig = {  
  apiKey: "AIzaSyDO3Va-R0c9gUpGwuw3QPM8Yny14Cmj_pc",  
  authDomain: "produkten-und-preis.firebaseapp.com",  
  projectId: "produkten-und-preis",  
  storageBucket: "produkten-und-preis.appspot.com",  
  messagingSenderId: "711683004620",  
  appId: "1:711683004620:web:edfc32242a1cd3ce6b4a69",  
  measurementId: "G-PXW51CGYDP"  
};  
firebase.initializeApp(firebaseConfig);  
const db = firebase.firestore();  
  
const container = document.getElementById('container-2');  
const fileInput = document.getElementById('file');  
const productNameInput = document.getElementById('productName');  
const priceInput = document.getElementById('price');  
const searchInput = document.getElementById('searchInput');  
  
let products = [];  
let cart = JSON.parse(localStorage.getItem('cart')) || [];  
  
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
      const product = { name, price, imageUrl: data.secure_url };  
      await db.collection('products').add(product);  
      fileInput.value = '';  
      productNameInput.value = '';  
      priceInput.value = '';  
      loadProducts();  
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
    .filter(p => typeof p.name === 'string' && p.name.toLowerCase().includes(searchTerm))  
    .forEach((product, index) => {  
      const div = document.createElement('div');  
      div.className = 'product';  
      div.innerHTML = `  
        <img src="${product.imageUrl}" alt="${product.name}" />  
        <h3>${product.name}</h3>  
        <p>السعر: €${product.price.toFixed(2)}</p>  
        <div class="buttons">  
          <button class="small-btn" onclick="addToCart(${index})">إضافة إلى السلة</button>  
        </div>  
      `;  
      container.appendChild(div);  
    });  
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
    p.innerHTML = `${item.name} - €${item.price.toFixed(2)} × ${item.quantity} = €${(item.price * item.quantity).toFixed(2)}  
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
  
function toggleCart() {  
  const cartDiv = document.getElementById('cart');  
  if (!cartDiv) return;  
  cartDiv.style.display = cartDiv.style.display === 'block' ? 'none' : 'block';  
}  
  
async function loadProducts() {  
  const snapshot = await db.collection('products').get();  
  products = snapshot.docs
    .map(doc => doc.data())
    .filter(p => p.name && p.price && p.imageUrl);  // تأكد من وجود الحقول الضرورية
  renderProducts();  
}  
  
loadProducts();  
updateCartDisplay();
