// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyDO3Va-R0c9gUpGwuw3QPM8Yny14Cmj_pc",
  authDomain: "produkten-und-preis.firebaseapp.com",
  projectId: "produkten-und-preis",
  storageBucket: "produkten-und-preis.appspot.com",
  messagingSenderId: "711683004620",
  appId: "1:711683004620:web:edfc32242a1cd3ce6b4a69",
  measurementId: "G-PXW51CGYDP"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
const db = firebase.firestore();

const container = document.getElementById('container-2');
const fileInput = document.getElementById('file');
const productNameInput = document.getElementById('productName');
const priceInput = document.getElementById('price');
const searchInput = document.getElementById('searchInput');

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function addProduct() {
  const file = fileInput.files[0];
  const name = productNameInput.value.trim();
  const price = parseFloat(priceInput.value);

  if (!file || !name || isNaN(price) || price <= 0) {
    alert('يرجى إدخال كل الحقول بشكل صحيح.');
    return;
  }

  try {
    // رفع الصورة إلى Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`product_images/${Date.now()}_${file.name}`);
    await imageRef.put(file);
    const imageUrl = await imageRef.getDownloadURL();

    // إضافة بيانات المنتج إلى Firestore
    await db.collection('products').add({
      name,
      price,
      imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    fileInput.value = '';
    productNameInput.value = '';
    priceInput.value = '';

    alert('تم إضافة المنتج بنجاح');
    fetchProducts(); // إعادة جلب المنتجات لعرضها
  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء إضافة المنتج');
  }
}

async function fetchProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  container.innerHTML = '';

  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let filtered = products;
    if (searchTerm) {
      filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    filtered.forEach((product, index) => {
      const div = document.createElement('div');
      div.className = 'product';

      div.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>السعر: €${product.price.toFixed(2)}</p>
        <div class="buttons">
          <button class="small-btn" onclick="deleteProduct('${product.id}')">حذف</button>
          <button class="small-btn" onclick="editPrice('${product.id}', ${product.price})">تغيير السعر</button>
          <button class="small-btn" onclick="addToCart(${index})">إضافة إلى السلة</button>
        </div>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
  }
}

async function deleteProduct(id) {
  if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
    try {
      await db.collection('products').doc(id).delete();
      alert('تم حذف المنتج');
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  }
}

async function editPrice(id, currentPrice) {
  const newPrice = prompt('أدخل السعر الجديد:', currentPrice);
  if (newPrice !== null) {
    const p = parseFloat(newPrice);
    if (!isNaN(p) && p > 0) {
      try {
        await db.collection('products').doc(id).update({ price: p });
        alert('تم تحديث السعر');
        fetchProducts();
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء تحديث السعر');
      }
    } else {
      alert('السعر غير صالح.');
    }
  }
}

// الكود الخاص بالسلة بدون تغيير (يمكنك نسخه من كودك السابق)
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

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
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
      <button onclick="decreaseQuantity(${i})">－</button>
    `;
    cartItems.appendChild(p);
    total += item.price * item.quantity;
    totalQuantity += item.quantity;
  });

  totalPriceEl.textContent = `السعر النهائي: €${total.toFixed(2)}`;
  cartCount.textContent = totalQuantity;
}

function toggleCart() {
  const cartDiv = document.getElementById('cart');
  if (!cartDiv) return;
  cartDiv.style.display = cartDiv.style.display === 'block' ? 'none' : 'block';
}

// تحميل المنتجات عند بدء الصفحة
fetchProducts();
updateCartDisplay();
