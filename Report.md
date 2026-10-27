# 專題報告

## 1. 名稱

- 專題名稱：手搖飲料 POS 點餐系統
- 學號：（請填寫）

---

## 2. 目的

手搖飲料店點餐時，需要快速記錄客人點的飲料，並正確算出總金額。本專題使用 HTML、CSS 與 JavaScript，製作一個可以在瀏覽器中操作的簡易點餐系統，讓店員能夠點餐、修改數量、自動計算金額，並在結帳後清空訂單。

---

## 3. 功能

- 1.顯示今日菜單，每種飲料有名稱、價格與「點餐」按鈕
- 2.按「點餐」後，飲料加入右側結帳清單；重複點同一種飲料時，數量加 1
- 3.結帳清單可用「+」「-」調整數量，數量減到 0 時自動移除
- 4.按「刪除」可直接移除該品項
- 5.自動計算並顯示總金額
- 6.按「清空訂單」可清空整筆訂單（會先跳出確認視窗）

---

## 4. 程式運作流程說明

程式用兩個陣列記錄資料：`menu` 是菜單，`order` 是客人點的飲料。畫面上看到的內容，都是根據這兩個陣列畫出來的。

### 步驟 1：建立 `menu` 陣列，存放菜單資料

`menu` 陣列裡的每一筆是一個物件，記錄飲料的編號 (`id`)、名稱 (`name`) 與價格 (`price`)。這份資料固定不變。

```js
this.menu = [
  { id: 1, name: "珍珠奶茶", price: 50 },
  { id: 2, name: "咖啡牛奶", price: 60 },
  { id: 3, name: "四季春茶", price: 30 }
];
```

程式碼說明：用中括號 `[ ]` 建立陣列，大括號 `{ }` 建立物件。`id` 不可重複，之後要靠它辨識是哪一杯飲料。

### 步驟 2：抓取 `menu` 的資料，畫出左側菜單（`renderMenu`）

用 `forEach` 一筆一筆取出 `menu` 裡的飲料，為每種飲料產生一列 HTML，內容包含名稱、價格與「點餐」按鈕。按鈕上會用 `data-id` 記錄這杯飲料的編號，方便之後知道按的是哪一杯。

```js
renderMenu() {
  this.menuListEl.innerHTML = '';   // 先清空，避免內容重複

  this.menu.forEach(drink => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <span>${drink.name} ${drink.price} 元</span>
      <button class="add-btn" data-id="${drink.id}">點餐</button>
    `;
    this.menuListEl.append(div);    // 把做好的 HTML 放進畫面
  });
}
```

程式碼說明：`forEach` 會依序處理每一種飲料；反引號 `` ` ` `` 裡的 `${ }` 會被換成變數的值；`data-id` 把飲料編號存在按鈕上。

### 步驟 3：建立 `order` 陣列，存放客人點的飲料

`order` 一開始是空陣列。客人點餐後，會放入像 `{ id: 1, name: "珍珠奶茶", price: 50, qty: 2 }` 的物件，其中 `qty` 是數量。

```js
this.order = [];
```

程式碼說明：空陣列代表目前沒有點任何飲料。

### 步驟 4：偵測「點餐」按鈕，加入 `order` 陣列（`addToOrder`）

按下「點餐」後，程式從按鈕的 `data-id` 得知是哪一杯飲料，再檢查 `order` 裡是否已經有它：

- 已經有：把該筆的數量 `qty` 加 1
- 還沒有：從 `menu` 取出這杯飲料，加上 `qty: 1` 後放進 `order`

修改完資料後，呼叫 `renderOrder()` 更新畫面。

```js
addToOrder(e) {
  const btn = e.target.closest('.add-btn');   // 找出被按的「點餐」按鈕
  if (!btn) return;                           // 不是點餐按鈕就結束

  const drinkId = Number(btn.dataset.id);     // 讀出 data-id，轉成數字
  const existingItem = this.order.find(item => item.id === drinkId);

  if (existingItem) {
    existingItem.qty += 1;                    // 已經有：數量加 1
  } else {
    const drink = this.menu.find(d => d.id === drinkId);
    this.order.push({ ...drink, qty: 1 });    // 還沒有：加入並設數量為 1
  }

  this.renderOrder();                         // 資料改完，更新畫面
}
```

程式碼說明：`dataset` 讀出來是字串，要用 `Number()` 轉成數字才能和 `id` 比較；`find` 找到會回傳該筆資料，找不到回傳 `undefined`；`{ ...drink, qty: 1 }` 是複製 `drink` 的內容再加上 `qty`。

### 步驟 5：偵測「+」「-」「刪除」按鈕，修改 `order` 陣列（`handleOrderAction`）

這三個按鈕有 `data-action`（要做什麼動作）與 `data-id`（對哪一杯做）兩個資訊。程式先找出該飲料在 `order` 裡的位置，再依照動作修改：

- 「+」：數量加 1
- 「-」：數量減 1，減到 0 時把該筆從 `order` 移除
- 「刪除」：不管數量，直接把該筆從 `order` 移除

修改完資料後，呼叫 `renderOrder()` 更新畫面。

```js
handleOrderAction(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;          // "add"、"minus" 或 "delete"
  const drinkId = Number(btn.dataset.id);

  const index = this.order.findIndex(item => item.id === drinkId);
  if (index === -1) return;                   // 找不到就結束

  if (action === 'add') {
    this.order[index].qty += 1;
  } else if (action === 'minus') {
    this.order[index].qty -= 1;
    if (this.order[index].qty <= 0) {
      this.order.splice(index, 1);            // 數量歸零，移除該筆
    }
  } else if (action === 'delete') {
    this.order.splice(index, 1);              // 直接移除該筆
  }

  this.renderOrder();
}
```

程式碼說明：`findIndex` 回傳位置（從 0 開始），找不到回傳 -1；`splice(index, 1)` 代表從該位置刪除 1 筆資料。

### 步驟 6：抓取 `order` 的資料，畫出右側結帳清單（`renderOrder`）

每次都先清空右側清單，再根據最新的 `order` 重新畫出：

- `order` 是空的：顯示「目前尚未點餐，請從左側選擇飲料」
- `order` 有資料：每一筆畫出名稱、數量，以及「+」「-」「刪除」按鈕

```js
renderOrder() {
  this.orderListEl.innerHTML = '';

  if (this.order.length === 0) {
    this.orderListEl.innerHTML = '<p>目前尚未點餐，請從左側選擇飲料</p>';
  } else {
    this.order.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <span>${item.name}</span>
        <div>
          <button data-action="minus" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button data-action="add" data-id="${item.id}">+</button>
          <button class="delete-btn" data-action="delete" data-id="${item.id}">刪除</button>
        </div>
      `;
      this.orderListEl.append(div);
    });
  }

  this.calculateTotal();   // 畫完後，更新總金額
}
```

程式碼說明：每個按鈕都帶有 `data-action` 與 `data-id`，步驟 5 就是靠這兩個值判斷要做什麼；`this.order.length === 0` 用來判斷陣列是否為空。

### 步驟 7：計算總金額，顯示在畫面上（`calculateTotal`）

用 `reduce` 把 `order` 裡每一筆的「單價 × 數量」加總，再把結果顯示在畫面上的總金額位置。這個步驟會在每次 `renderOrder()` 結束時執行，所以每次訂單改變，總金額都會同步更新。

```js
calculateTotal() {
  const total = this.order.reduce((sum, item) => sum + item.price * item.qty, 0);
  this.totalPriceEl.textContent = total;
}
```

程式碼說明：`reduce` 會把陣列累加成一個值，`sum` 是目前累加的結果，最後的 `0` 是起始值；例如珍珠奶茶 50 × 2 加上四季春茶 30 × 1，總金額是 130。

### 步驟 8：偵測「清空訂單」按鈕，清空 `order` 陣列（`clearOrder`）

- `order` 是空的：跳出提示「目前沒有訂單可以清空喔！」
- `order` 有資料：跳出確認視窗，按「確定」後把 `order` 設回空陣列，並呼叫 `renderOrder()` 更新畫面

```js
clearOrder() {
  if (this.order.length === 0) {
    alert("目前沒有訂單可以清空喔！");
    return;
  }

  const isConfirm = confirm("確定要清空整筆訂單嗎？");
  if (isConfirm) {
    this.order = [];       // 把訂單設回空陣列
    this.renderOrder();    // 更新畫面
  }
}
```

程式碼說明：`alert` 跳出提示視窗；`confirm` 跳出「確定／取消」視窗，按確定回傳 `true`，按取消回傳 `false`。

### 整體原則

步驟 4、5、8 都遵守同一個原則：**先修改 `order` 陣列，再根據陣列重新畫出畫面。** 這樣畫面上的內容一定和資料一致。