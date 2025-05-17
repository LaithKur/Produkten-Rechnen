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
let productsDocs = [];  // مصفوفة تخزن معرفات المستندات (doc.id)
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
    .filter(p => p.name && p.name.toLowerCase().includes(searchTerm))  
    .forEach((product, index) => {  
      const div = document.createElement('div');  
      div.className = 'product';  
      div.innerHTML = `  
        <img src="${product.imageUrl}" alt="${product.name}" />  
        <h3>${product.name}</h3>  
        <p>السعر: €${product.price.toFixed(2)}</p>  
        <div class="buttons">  
          <button class="small-btn" onclick="addToCart(${index})">إضافة إلى السلة</button>  
          <button class="small-btn" onclick="showEditForm(${index})">تعديل</button>  
          <button class="small-btn" onclick="deleteProduct(${index})">حذف</button>  
        </div>  
        <div id="edit-form-${index}" class="edit-form" style="display:none; margin-top:10px;">  
          <input type="text" id="edit-name-${index}" value="${product.name}" placeholder="اسم المنتج" />  
          <input type="number" id="edit-price-${index}" value="${product.price}" step="0.01" placeholder="السعر" />  
          <button onclick="saveEdit(${index})">حفظ</button>  
          <button onclick="cancelEdit(${index})">إلغاء</button>  
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
  try {
    const snapshot = await db.collection('products').get();  
    products = [];  
    productsDocs = [];  
    snapshot.docs.forEach(doc => {  
      const data = doc.data();  
      if(data.name && data.price && data.imageUrl){  
        products.push(data);  
        productsDocs.push(doc.id);  
      } else {  
        console.warn('منتج بدون بيانات كاملة تم تجاهله:', data);  
      }  
    });  
    renderProducts();  
  } catch (error) {
    console.error('خطأ في تحميل المنتجات:', error);
  }
}  
  
async function deleteProduct(index) {  
  const confirmDelete = confirm(`هل تريد حذف المنتج "${products[index].name}"؟`);  
  if (!confirmDelete) return;  
  try {  
    await db.collection('products').doc(productsDocs[index]).delete();  
    await loadProducts();  
  } catch (error) {  
    console.error('خطأ في حذف المنتج:', error);  
    alert('حدث خطأ أثناء حذف المنتج');  
  }  
}  
  
function showEditForm(index) {  
  const form = document.getElementById(`edit-form-${index}`);  
  if(form) form.style.display = 'block';  
}  
  
function cancelEdit(index) {  
  const form = document.getElementById(`edit-form-${index}`);  
  if(form) form.style.display = 'none';  
}  
  
async function saveEdit(index) {  
  const newName = document.getElementById(`edit-name-${index}`).value.trim();  
  const newPrice = parseFloat(document.getElementById(`edit-price-${index}`).value);  
  if (!newName || isNaN(newPrice) || newPrice <= 0) {  
    alert('يرجى إدخال اسم وسعر صحيحين.');  
    return;  
  }  
  try {  
    await db.collection('products').doc(productsDocs[index]).update({  
      name: newName,  
      price: newPrice  
    });  
    cancelEdit(index);  
    await loadProducts();  
  } catch (error) {  
    console.error('خطأ في تعديل المنتج:', error);  
    alert('حدث خطأ أثناء تعديل المنتج');  
  }  
}  
  
loadProducts();  
updateCartDisplay();
