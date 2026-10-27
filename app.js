/*
 * ============================================================
 * 飲料店點餐系統 (POS System)
 * ============================================================
 * 功能說明：
 *   1. 左邊顯示菜單，按「點餐」可以把飲料加入訂單
 *   2. 右邊顯示訂單，可以用「+」「-」調整數量，或按「刪除」移除
 *   3. 自動計算總金額
 *   4. 可以一鍵清空整筆訂單
 *
 * 需要的 HTML 元素 (id 必須和下面的 querySelector 完全一致)：
 *   #menu-list    放菜單的容器
 *   #order-list   放訂單的容器
 *   #total-price  顯示總金額的標籤 (例如 <span id="total-price">)
 *   #clear-btn    清空訂單的按鈕
 *
 * 程式設計的核心概念：
 *   「資料」和「畫面」要分開。
 *   先修改資料 (this.menu / this.order)，再根據資料重新畫出畫面。
 *   這樣資料永遠是正確的來源，畫面只是資料的呈現結果。
 */

// class 是 JavaScript 用來把「資料」和「操作資料的函式」包在一起的語法。
// 這裡把整個點餐系統包成一個 class，名稱叫 POSSystem。
class POSSystem {

  // ==========================================
  // 一、建構子 (constructor)
  // ==========================================
  // 當我們寫 new POSSystem() 時，JavaScript 會自動執行 constructor。
  // 這裡通常用來「準備資料」和「取得需要操作的 HTML 元素」。
  constructor() {
    // 1. 菜單資料：用「陣列 + 物件」儲存。
    //    每個物件代表一種飲料：id 是編號 (不能重複)，name 是名稱，price 是單價。
    //    這份資料不會改變，所以叫做「固定資料」。
    this.menu = [
      { id: 1, name: "珍珠奶茶", price: 50 },
      { id: 2, name: "咖啡牛奶", price: 60 },
      { id: 3, name: "四季春茶", price: 30 }
    ];

    // 2. 訂單資料：一開始是空陣列。
    //    客人點餐後，會放進像這樣的物件：{ id: 1, name: "珍珠奶茶", price: 50, qty: 2 }
    //    qty 是 quantity 的縮寫，代表「數量」。
    this.order = [];

    // 3. 用 querySelector 取得 HTML 元素。
    //    參數寫法和 CSS 選擇器一樣：'#xxx' 代表 id 為 xxx 的元素。
    //    取得後存在 this 裡面，之後整個 class 的其他函式都可以使用。
    this.menuListEl = document.querySelector('#menu-list');
    this.orderListEl = document.querySelector('#order-list');
    this.totalPriceEl = document.querySelector('#total-price');
    this.clearBtn = document.querySelector('#clear-btn');

    // 4. 防呆檢查：如果 HTML 裡少了任何一個元素，querySelector 會回傳 null。
    //    之後對 null 操作 (例如 null.innerHTML) 會讓程式當掉。
    //    所以先檢查，缺少時在 Console 顯示明確的錯誤訊息，然後停止執行。
    if (!this.menuListEl || !this.orderListEl || !this.totalPriceEl || !this.clearBtn) {
      console.error('找不到必要的 HTML 元素，請檢查 id 是否正確：#menu-list、#order-list、#total-price、#clear-btn');
      return; // return 會直接結束 constructor，不會執行下面的 init()
    }

    // 5. 資料準備好了，呼叫 init() 開始執行初始化。
    this.init();
  }

  // ==========================================
  // 二、初始化 (init)
  // ==========================================
  // 負責做兩件事：第一次把畫面畫出來、設定好點擊事件。
  init() {
    // 第一次畫出畫面。
    this.renderMenu();  // 畫出左邊的菜單
    this.renderOrder(); // 畫出右邊的訂單 (此時是空的，會顯示提示文字)

    // 【事件委派 (Event Delegation)】
    // 菜單和訂單裡的按鈕，是用 JavaScript 動態產生的，而且訂單每次更新都會重新產生。
    // 如果直接對每個按鈕綁定事件，重新畫畫面後事件就消失了。
    //
    // 解法：把事件綁在「不會被刪除的父元素」上。
    // 點擊事件會從子元素「往上傳遞」(稱為事件冒泡)，
    // 所以父元素可以接收到裡面任何子元素的點擊，再判斷到底點到的是哪一個。
    //
    // 箭頭函式 (e) => ... 中的 e 是事件物件，裡面記錄了這次點擊的資訊。
    // 使用箭頭函式是為了讓函式裡的 this 仍然指向 POSSystem 這個物件。
    this.menuListEl.addEventListener('click', (e) => this.addToOrder(e));
    this.orderListEl.addEventListener('click', (e) => this.handleOrderAction(e));

    // 清空按鈕本身一直存在於 HTML 中 (不是動態產生的)，所以可以直接綁定。
    this.clearBtn.addEventListener('click', () => this.clearOrder());
  }

  // ==========================================
  // 三、畫出左邊的菜單 (renderMenu)
  // ==========================================
  // render 的意思是「渲染」，也就是根據資料產生 HTML 並顯示在畫面上。
  renderMenu() {
    // 先清空容器，避免重複呼叫時，內容越疊越多。
    this.menuListEl.innerHTML = '';

    // forEach 會依序取出陣列中的每一個元素，這裡每個元素叫做 drink。
    this.menu.forEach(drink => {
      // 建立一個新的 <div> 元素。
      const div = document.createElement('div');
      div.className = 'item'; // 設定 class，方便用 CSS 設定樣式

      // 用「樣板字串」(反引號 ` `) 組出 HTML。
      // ${...} 的位置會被替換成變數的值。
      //
      // data-id 是 HTML 的「自訂資料屬性」，可以把資料存在元素上。
      // 之後點擊按鈕時，可以用 e.target.dataset.id 讀出這杯飲料的編號。
      div.innerHTML = `
        <span>${drink.name} ${drink.price} 元</span>
        <button class="add-btn" data-id="${drink.id}">點餐</button>
      `;

      // append 把做好的元素加到容器的最後面。
      this.menuListEl.append(div);
    });
  }

  // ==========================================
  // 四、點擊左邊「點餐」按鈕後執行 (addToOrder)
  // ==========================================
  // 參數 e 是 click 事件物件。
  addToOrder(e) {
    // 1. 找出「真正被點到的點餐按鈕」。
    //    e.target 是實際被點擊的元素。
    //    closest('.add-btn') 會從該元素開始往上找，回傳最近的 .add-btn 元素；
    //    如果找不到就回傳 null。
    //    這樣即使按鈕裡面有其他子元素 (例如圖示)，點到子元素也能正確判斷。
    const btn = e.target.closest('.add-btn');
    if (!btn) return; // 沒點到點餐按鈕 (例如點到空白處)，直接結束函式

    // 2. 讀取按鈕上的 data-id。
    //    dataset 讀出來的值一定是「字串」，但 menu 裡的 id 是「數字」。
    //    用 === 比較時，"1" 和 1 不相等，所以要先用 Number() 轉成數字。
    const drinkId = Number(btn.dataset.id);

    // 3. 用 find 在訂單中尋找這杯飲料。
    //    find 會回傳「第一個符合條件的元素」，找不到就回傳 undefined。
    const existingItem = this.order.find(item => item.id === drinkId);

    if (existingItem) {
      // 情況 A：訂單已經有這杯飲料，只要把數量加 1。
      // existingItem 和 this.order 裡的物件是同一個，所以修改它就等於修改訂單。
      existingItem.qty += 1;
    } else {
      // 情況 B：訂單還沒有這杯飲料，先從菜單找出完整資料。
      const drink = this.menu.find(d => d.id === drinkId);

      // 防呆：如果菜單裡找不到這個 id (理論上不會發生)，就不處理。
      if (!drink) return;

      // { ...drink, qty: 1 } 使用「展開運算子」：
      // 先複製 drink 的所有屬性 (id、name、price)，再新增 qty: 1。
      // 這樣是建立「新物件」，不會改到 this.menu 裡的原始資料。
      this.order.push({ ...drink, qty: 1 });
    }

    // 4. 資料已經改變，重新畫出右邊的訂單，畫面才會更新。
    this.renderOrder();
  }

  // ==========================================
  // 五、點擊右邊「+」「-」「刪除」按鈕後執行 (handleOrderAction)
  // ==========================================
  handleOrderAction(e) {
    // 1. 找出被點到的按鈕。
    //    'button[data-action]' 代表「有 data-action 屬性的 button」，
    //    也就是只處理我們在 renderOrder 裡產生的那三種按鈕。
    const btn = e.target.closest('button[data-action]');
    if (!btn) return; // 點到的不是這些按鈕就結束

    // 2. 讀取按鈕上存的資料：
    //    action：要做什麼動作 ("add"、"minus"、"delete")
    //    drinkId：要對哪一杯飲料操作 (記得用 Number 轉成數字)
    const action = btn.dataset.action;
    const drinkId = Number(btn.dataset.id);

    // 3. 用 findIndex 找出這杯飲料在陣列中的「位置 (索引)」。
    //    索引從 0 開始。找不到時 findIndex 會回傳 -1。
    //    這裡用索引而不是 find，是因為後面刪除時需要知道位置。
    const index = this.order.findIndex(item => item.id === drinkId);
    if (index === -1) return; // -1 代表找不到，直接結束，避免出錯

    // 4. 依照動作修改訂單資料。
    if (action === 'add') {
      // 數量 +1
      this.order[index].qty += 1;

    } else if (action === 'minus') {
      // 數量 -1
      this.order[index].qty -= 1;

      // 數量減到 0 (或以下) 時，這杯飲料就不該留在訂單裡了。
      // splice(index, 1) 的意思是：從 index 位置開始，刪除 1 個元素。
      if (this.order[index].qty <= 0) {
        this.order.splice(index, 1);
      }

    } else if (action === 'delete') {
      // 不管數量是多少，直接刪除這筆訂單項目。
      this.order.splice(index, 1);
    }

    // 5. 資料改好後，重新畫出訂單。
    this.renderOrder();
  }

  // ==========================================
  // 六、畫出右邊的訂單 (renderOrder)
  // ==========================================
  renderOrder() {
    // 先清空容器，之後根據最新的 this.order 重新畫。
    this.orderListEl.innerHTML = '';

    if (this.order.length === 0) {
      // 訂單是空的：顯示提示文字。
      this.orderListEl.innerHTML =
        '<p style="color:#aaa; text-align:center;">目前尚未點餐，請從左側選擇飲料</p>';
    } else {
      // 訂單有資料：每一筆資料畫成一列。
      this.order.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';

        // 每個按鈕都有兩個 data 屬性：
        //   data-action：這個按鈕要做什麼
        //   data-id：這個按鈕屬於哪一杯飲料
        // handleOrderAction 就是靠這兩個值判斷該做什麼。
        div.innerHTML = `
          <span>${item.name}</span>
          <div>
            <button data-action="minus" data-id="${item.id}">-</button>
            <span style="display:inline-block; width: 20px; text-align:center;">${item.qty}</span>
            <button data-action="add" data-id="${item.id}">+</button>
            <button class="delete-btn" data-action="delete" data-id="${item.id}">刪除</button>
          </div>
        `;
        this.orderListEl.append(div);
      });
    }

    // 訂單畫完後，重新計算總金額。
    // 每次訂單改變都會經過 renderOrder，所以金額一定會同步更新。
    this.calculateTotal();
  }

  // ==========================================
  // 七、計算總金額 (calculateTotal)
  // ==========================================
  calculateTotal() {
    // reduce 會把陣列「累加」成一個值。
    //   sum：目前累加的結果 (起始值是最後面的 0)
    //   item：目前處理的那一筆訂單
    // 每一筆的小計 = 單價 × 數量，再加到 sum 裡。
    // 例如：珍珠奶茶 50 × 2 + 四季春茶 30 × 1 = 130
    const total = this.order.reduce((sum, item) => sum + item.price * item.qty, 0);

    // textContent 用來設定元素的文字內容，這裡把總金額顯示到畫面上。
    this.totalPriceEl.textContent = total;
  }

  // ==========================================
  // 八、清空訂單 (clearOrder)
  // ==========================================
  clearOrder() {
    // 訂單本來就是空的，就提醒使用者並結束函式。
    if (this.order.length === 0) {
      alert("目前沒有訂單可以清空喔！");
      return;
    }

    // confirm 會跳出「確定 / 取消」視窗：
    // 按確定回傳 true，按取消回傳 false。
    const isConfirm = confirm("確定要清空整筆訂單嗎？");

    if (isConfirm) {
      this.order = [];    // 把訂單資料重設為空陣列
      this.renderOrder(); // 重新畫出畫面 (會顯示「尚未點餐」，總金額變 0)
    }
  }
}

// ==========================================
// 啟動程式
// ==========================================
// DOMContentLoaded 事件會在 HTML 全部解析完成後觸發。
// 必須等到這個時候才能 querySelector，否則元素可能還不存在，會取得 null。
// 事件觸發後，new POSSystem() 會建立一個點餐系統並自動執行 constructor。
document.addEventListener('DOMContentLoaded', () => {
  new POSSystem();
});