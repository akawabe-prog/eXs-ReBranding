/* =========================================
   JS/accessories.js - アクセサリーページ用スクリプト
   ========================================= */
import { ProductApiRequester } from "./services/product-api-requester-init.js";
import { initApiClient, init, addItemToCart, addItemsToCart } from "./api-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector(".grid");
  const productFilters = document.querySelector("#accessories-product-filters");
  const categoryFilters = document.querySelector(
    "#accessories-category-filters",
  );
  const filterMeta = document.querySelector("#accessories-filter-meta");
  const filterState = { product: "all", category: "all" };

  // ローディング表示
  if (grid)
    grid.innerHTML =
      '<div class="col-span-full text-center py-20"><i class="fa-solid fa-spinner fa-spin text-3xl text-gray-300"></i></div>';

  // APIクライアント初期化（exs-api仕様に合わせる）
  initApiClient(
    (window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl) || undefined,
  );
  try {
    await init();
  } catch (error) {
    console.warn("[accessories] init failed", error);
  }

  try {
    // APIからデータ取得
    const accessories = await fetchAccessoriesData();

    // 初期表示
    renderAccessories(accessories, grid);

    // フィルタリング設定
    setupFilters(accessories, {
      productContainer: productFilters,
      categoryContainer: categoryFilters,
      metaElement: filterMeta,
      grid,
      state: filterState,
    });
  } catch (error) {
    console.error("Accessories fetch error:", error);
    if (grid)
      grid.innerHTML =
        '<div class="col-span-full text-center py-20 text-gray-500">データの取得に失敗しました。</div>';
  }
});

async function fetchAccessoriesData() {
  try {
    const queryApiUrl = new URLSearchParams(window.location.search).get("api");
    const configuredApiUrl =
      window.EXS_API_CONFIG && window.EXS_API_CONFIG.accessoriesUrl;
    const apiUrl = queryApiUrl || configuredApiUrl;

    // 設定URLがある場合は直接取得（商品ページと同一方針）
    if (apiUrl) {
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
      const json = await response.json();
      if (json?.result === "error") {
        const errCode = json?.errors?.[0]?.cd || "";
        const errMessage = json?.errors?.[0]?.abstract || "";
        throw new Error(`API error: ${errCode} ${errMessage}`.trim());
      }
      const raw = json.data || json.products || json.items || json;
      if (Array.isArray(raw) && raw.length > 0)
        return raw.filter(isSellableAccessory).map(normalizeAccessory);
    }

    // ProductApiRequesterを使用してAPIリクエスト（既存互換）
    const response = await ProductApiRequester.fetchAccessories();

    // レスポンスの形式に合わせてデータを抽出 (例: response.data や response.products など)
    if (response?.result === "error") {
      const errCode = response?.errors?.[0]?.cd || "";
      const errMessage = response?.errors?.[0]?.abstract || "";
      throw new Error(`API error: ${errCode} ${errMessage}`.trim());
    }

    if (
      response?.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      return response.data.filter(isSellableAccessory).map(normalizeAccessory);
    }

    // データが空、またはAPI未実装の場合はモックデータを返す
    console.warn("[accessories] API returned empty data, using mock data.");
    return getMockData();
  } catch (e) {
    console.warn("[accessories] API request failed, using mock data.", e);
    // エラー時はモックデータをフォールバックとして使用
    return getMockData();
  }
}


// 廃番・販売終了商品は一覧に出さない
function isSellableAccessory(item) {
  if (item?.isNotForSale === true) return false;
  const statusCd = item?.status?.cd || "";
  if (statusCd.startsWith("DC")) return false; // DC系 = 廃番
  return true;
}

function renderAccessories(items, container) {
  if (!container) return;
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML =
      '<div class="col-span-full text-center py-20 text-gray-500">該当する商品がありません。</div>';
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className =
      "card bg-white border border-gray-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg opacity-0";
    card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;

    const placeholderSrc = buildAccessoryPlaceholder(item);
    const imgSrc = getRenderableImageSrc(item);
    const isMockAddToCart = item._isMock === true && !!item.itemId;
    const ctaLabel = item.itemId
      ? "カートに追加"
      : item.url
        ? "購入先へ進む"
        : "詳細を見る";
    const buttonLabel = isMockAddToCart ? "API準備中" : ctaLabel;
    const buttonClass = isMockAddToCart
      ? "btn--outline w-full py-3 border border-gray-300 text-xs font-bold tracking-widest text-gray-400 bg-gray-50 cursor-not-allowed add-to-cart-btn"
      : "btn--outline w-full py-3 border border-black text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors add-to-cart-btn";
    const priceMarkup = item.priceTaxIn
      ? `<p class="text-base font-en font-bold mb-4">${formatYen(item.priceTaxIn)}</p>`
      : '<p class="text-sm text-gray-400 mb-4">価格は購入先ページでご確認ください</p>';
    const chipsMarkup = buildCardChips(item);

    card.innerHTML = `
            <div class="card__image relative aspect-[4/3] bg-gray-50 overflow-hidden">
                ${item.itemId && !item._isMock ? `<label class="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 px-3 py-1.5 text-xs font-bold cursor-pointer shadow-sm"><input type="checkbox" class="accessory-select w-4 h-4 accent-black" data-item-id="${item.itemId}" data-price="${item.priceTaxIn || 0}">まとめて選択</label>` : ""}
                <img src="${imgSrc}" alt="${escapeHtml(item.name)}" data-placeholder-src="${placeholderSrc}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
            </div>
            <div class="card__body p-5">
                <span class="card__tag text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-1">${item.categoryLabel || item.category}</span>
                <h3 class="card__title text-lg font-bold mb-2 leading-tight">${item.name}</h3>
                <div class="card__chips">${chipsMarkup}</div>
                <span class="card__compatibility text-xs font-bold text-gray-500 block mb-3">対応: ${item.compatibilityLabel || item.compatibility || "全モデル"}</span>
                <p class="card__desc text-sm text-gray-600 mb-5 leading-relaxed line-clamp-2">${item.description}</p>
                ${priceMarkup}
                <button class="${buttonClass}" data-item-id="${item.itemId || ""}" data-product-name="${item.name}" data-product-url="${item.url || ""}" ${isMockAddToCart ? "disabled" : ""}>${buttonLabel}</button>
                <p class="mt-3 text-xs text-center text-gray-500 min-h-[1rem] cart-feedback" aria-live="polite"></p>
            </div>
        `;
    container.appendChild(card);

    const image = card.querySelector("img");
    if (image) {
      image.addEventListener(
        "error",
        () => {
          const fallbackSrc =
            image.dataset.placeholderSrc || buildAccessoryPlaceholder(item);
          if (image.src === fallbackSrc) return;
          image.src = fallbackSrc;
        },
        { once: true },
      );
    }
  });

  setupAddToCartButtons(container);
  setupAccessorySelection(container);
}


/* ---- 複数選択してまとめてカートに追加 ---- */
const CART_URL_FALLBACK = "https://www.customjapan.net/cart?site=exs";
const selectedAccessories = new Map(); // itemId -> price

function ensureCartBar() {
  let bar = document.getElementById("accessory-cart-bar");
  if (bar) return bar;
  bar = document.createElement("div");
  bar.id = "accessory-cart-bar";
  bar.className =
    "fixed bottom-0 left-0 right-0 z-50 bg-brand-black text-white px-6 py-4 hidden shadow-[0_-6px_20px_rgba(0,0,0,0.15)]";
  bar.innerHTML = `
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="text-sm"><span id="acc-sel-count" class="font-en font-bold">0</span> 点選択中｜合計 <span id="acc-sel-total" class="font-en font-bold">0円</span></p>
      <button id="acc-cart-btn" type="button" class="bg-white text-black px-8 py-3 text-xs font-bold tracking-widest hover:bg-gray-200 transition w-full sm:w-auto">選択した商品をカートに追加</button>
    </div>`;
  document.body.appendChild(bar);
  bar.querySelector("#acc-cart-btn").addEventListener("click", addSelectedToCart);
  return bar;
}

function updateCartBar() {
  const bar = ensureCartBar();
  const count = selectedAccessories.size;
  bar.classList.toggle("hidden", count === 0);
  bar.querySelector("#acc-sel-count").textContent = String(count);
  let total = 0;
  selectedAccessories.forEach((price) => { total += Number(price) || 0; });
  bar.querySelector("#acc-sel-total").textContent = formatYen(total);
}

function setupAccessorySelection(container) {
  container.querySelectorAll(".accessory-select").forEach((box) => {
    // フィルター切替で再描画されても選択状態を復元する
    box.checked = selectedAccessories.has(box.dataset.itemId);
    box.addEventListener("change", () => {
      if (box.checked) {
        selectedAccessories.set(box.dataset.itemId, box.dataset.price);
      } else {
        selectedAccessories.delete(box.dataset.itemId);
      }
      updateCartBar();
    });
  });
  updateCartBar();
}

async function addSelectedToCart() {
  const btn = document.getElementById("acc-cart-btn");
  if (!btn || selectedAccessories.size === 0) return;
  const items = Array.from(selectedAccessories.keys()).map((id) => ({ id, quantity: 1 }));
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "カートに追加中...";
  try {
    const result = await addItemsToCart(items);
    if (result && result.result === "error") {
      const message = result.errors?.[0]?.abstract || "カート追加に失敗しました。";
      btn.textContent = message;
      setTimeout(() => { btn.textContent = originalLabel; btn.disabled = false; }, 2500);
      return;
    }
    window.dispatchEvent(new CustomEvent("exs:cart-updated"));
    const cartUrl = (window.EXS_API_CONFIG && window.EXS_API_CONFIG.cartUrl) || CART_URL_FALLBACK;
    window.location.href = cartUrl;
  } catch (error) {
    console.warn("[accessories] bulk add to cart failed", error);
    btn.textContent = "通信エラーが発生しました";
    setTimeout(() => { btn.textContent = originalLabel; btn.disabled = false; }, 2500);
  }
}

function normalizeAccessory(item) {
  const productInfo = inferProductInfo(item);
  const categoryKey = normalizeCategoryKey(item);
  const categoryLabel =
    item?.categoryLabel ||
    item?.categoryName ||
    item?.category?.name ||
    item?.category ||
    formatFilterLabel(categoryKey);

  const itemId = normalizeItemId(item);
  return {
    ...item,
    id: item?.id || item?.productId || item?.code || "",
    itemId,
    name: item?.name || item?.productName || "商品名未設定",
    category: categoryKey,
    categoryLabel,
    compatibility:
      item?.compatibility ||
      item?.fitment ||
      productInfo.compatibilityLabel ||
      "全モデル",
    compatibilityLabel: productInfo.compatibilityLabel,
    description: item?.description || item?.caption || item?.summary || "",
    image: getAccessoryImage(item),
    url:
      item?.url ||
      item?.productUrl ||
      item?.item?.url ||
      item?.item?.productUrl ||
      "",
    priceTaxIn: normalizePriceTaxIn(item),
    productKeys: productInfo.productKeys,
    productLabels: productInfo.productLabels,
    isUniversal: productInfo.isUniversal,
    isCommonAccessory: productInfo.isCommonAccessory,
  };
}

const IMG_BASE_URL = "https://img.customjapan.net";

function getAccessoryImage(item) {
  // API レスポンスの img.l (大) / img.s (小) を優先
  const imgPath = item?.img?.l || item?.img?.s;
  if (imgPath) {
    return imgPath.startsWith("http") ? imgPath : `${IMG_BASE_URL}${imgPath}`;
  }

  return (
    item?.image ||
    item?.imgUrl ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.thumb ||
    item?.pictureUrl ||
    item?.mainImage ||
    item?.images?.[0] ||
    item?.item?.image ||
    item?.item?.imgUrl ||
    item?.item?.imageUrl ||
    item?.item?.thumbnail ||
    item?.item?.thumb ||
    item?.media?.image ||
    item?.media?.thumbnail ||
    item?.media?.url ||
    ""
  );
}

function getRenderableImageSrc(item) {
  const image = String(getAccessoryImage(item) || "").trim();
  return image || buildAccessoryPlaceholder(item);
}

function setupFilters(
  items,
  { productContainer, categoryContainer, metaElement, grid, state },
) {
  if (!grid) return;

  const productOptions = buildProductFilterOptions(items);

  function renderAllFilterGroups() {
    renderFilterButtons(
      productContainer,
      productOptions,
      state.product,
      (value) => {
        state.product = value;
        applyFilters(items, state, grid, metaElement);
        renderAllFilterGroups();
      },
    );
  }

  renderAllFilterGroups();
  applyFilters(items, state, grid, metaElement);
}

function setupAddToCartButtons(container) {
  const buttons = container.querySelectorAll(".add-to-cart-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      const itemId = button.getAttribute("data-item-id");
      const productName = button.getAttribute("data-product-name") || "商品";
      const productUrl = button.getAttribute("data-product-url");
      const feedback = button.parentElement?.querySelector(".cart-feedback");
      if (!itemId && productUrl) {
        window.location.href = productUrl;
        return;
      }
      if (!itemId) return;

      const setFeedback = (message, isError = false) => {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.classList.toggle("text-red-500", isError);
        feedback.classList.toggle("text-gray-500", !isError);
      };

      button.disabled = true;
      button.classList.add("opacity-60", "cursor-not-allowed");
      setFeedback("カートへ移動中...");

      try {
        const result = await addItemToCart(itemId, 1);
        if (result && result.result === "error") {
          const message =
            result.errors?.[0]?.abstract || "カート追加に失敗しました。";
          if (productUrl) {
            window.location.href = productUrl;
            return;
          }
          setFeedback(message, true);
          return;
        }
        window.dispatchEvent(new CustomEvent("exs:cart-updated"));
        const cartUrl = window.EXS_API_CONFIG && window.EXS_API_CONFIG.cartUrl;
        if (cartUrl) {
          window.location.href = cartUrl;
          return;
        }
        setFeedback(`${productName} をカートへ追加しました。`, false);
      } catch (error) {
        console.warn("add to cart failed, fallback message is shown.", error);
        if (productUrl) {
          window.location.href = productUrl;
          return;
        }
        setFeedback(
          "API接続待ちのため、商品ページへ遷移できませんでした。",
          true,
        );
      } finally {
        button.disabled = false;
        button.classList.remove("opacity-60", "cursor-not-allowed");
      }
    });
  });
}

function normalizeItemId(item) {
  const candidates = [
    item?.itemId,
    item?.item?.id,
    item?.productId,
    item?.id,
    item?.code,
  ];

  for (const value of candidates) {
    const normalized = String(value || "").trim();
    if (/^\d{6,}$/.test(normalized)) return normalized;
  }
  return "";
}

function normalizePriceTaxIn(item) {
  const candidates = [
    item?.price?.taxIn,
    item?.priceTaxIn,
    item?.taxIn,
    item?.price,
    item?.sellingPrice,
    item?.salesPrice,
  ];

  for (const value of candidates) {
    const price = Number(value);
    if (Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

function formatYen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function buildCardChips(item) {
  const chips = [];
  for (const label of item.productLabels || []) {
    chips.push(
      `<span class="card__chip card__chip--model">${escapeHtml(label)}</span>`,
    );
  }
  if (item.isUniversal || item.isCommonAccessory) {
    chips.push(
      '<span class="card__chip card__chip--universal">全モデル対応</span>',
    );
  }
  chips.push(
    `<span class="card__chip card__chip--category">${escapeHtml(item.categoryLabel || formatFilterLabel(item.category))}</span>`,
  );
  return chips.join("");
}

function buildProductFilterOptions(items) {
  const counts = new Map();
  for (const item of items) {
    for (const key of item.productKeys || []) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    if (item.isUniversal || item.isCommonAccessory) {
      counts.set("universal", (counts.get("universal") || 0) + 1);
    }
  }

  const options = [{ value: "all", label: "ALL ITEMS" }];
  for (const config of PRODUCT_FILTERS) {
    if (counts.has(config.key))
      options.push({ value: config.key, label: config.label });
  }
  if (counts.has("universal"))
    options.push({ value: "universal", label: "全モデル対応" });
  return options;
}

function buildCategoryFilterOptions(items) {
  const options = [{ value: "all", label: "ALL CATEGORY" }];
  const seen = new Map();
  for (const item of items) {
    if (!item.category) continue;
    if (!seen.has(item.category)) {
      seen.set(
        item.category,
        item.categoryLabel || formatFilterLabel(item.category),
      );
    }
  }
  for (const [value, label] of seen.entries()) {
    options.push({ value, label });
  }
  return options;
}

function renderFilterButtons(container, options, activeValue, onClick) {
  if (!container) return;
  container.innerHTML = "";
  for (const option of options) {
    const button = document.createElement("button");
    button.className = `filter__item${option.value === activeValue ? " active" : ""}`;
    button.type = "button";
    button.textContent = option.label;
    button.dataset.filter = option.value;
    button.addEventListener("click", () => onClick(option.value));
    container.appendChild(button);
  }
}

function applyFilters(items, state, container, metaElement) {
  const filteredItems = items.filter(
    (item) =>
      matchesProductFilter(item, state.product) &&
      matchesCategoryFilter(item, state.category),
  );
  renderAccessories(filteredItems, container);
  if (metaElement) {
    const productLabel = getFilterLabel(
      PRODUCT_FILTERS,
      state.product,
      "すべての商品",
    );
    metaElement.textContent = `${productLabel} : ${filteredItems.length}件`;
  }
}

function matchesProductFilter(item, productFilter) {
  if (productFilter === "all") return true;
  if (productFilter === "universal")
    return Boolean(item.isUniversal || item.isCommonAccessory);
  if (item.isUniversal) return true;
  return (item.productKeys || []).includes(productFilter);
}

function matchesCategoryFilter(item, categoryFilter) {
  if (categoryFilter === "all") return true;
  return item.category === categoryFilter;
}

function getFilterLabel(filters, value, fallback) {
  if (value === "all") return fallback;
  if (value === "universal") return "全モデル対応";
  return filters.find((filter) => filter.key === value)?.label || fallback;
}

function inferProductInfo(item) {
  const productKeys = new Set();

  // 1. IDベースのマッピングを優先（ITEM_MODEL_MAP に定義がある場合）
  const itemId = normalizeItemId(item);
  const mappedKeys = ITEM_MODEL_MAP[itemId];
  if (mappedKeys) {
    for (const key of mappedKeys) productKeys.add(key);
  }

  // 2. テキストパターンによるフォールバック（IDマッピングがない場合）
  if (productKeys.size === 0) {
    const sourceTexts = [
      item?.compatibility,
      item?.fitment,
      item?.name,
      item?.description,
      item?.caption,
      item?.summary,
    ]
      .filter(Boolean)
      .map(String);
    const typeFacetValues = Object.values(item?.type?.maker?.facet || {})
      .flat()
      .filter(Boolean);
    const combinedText =
      `${sourceTexts.join(" ")} ${typeFacetValues.join(" ")}`.toLowerCase();

    for (const filter of PRODUCT_FILTERS) {
      if (filter.patterns.some((pattern) => combinedText.includes(pattern))) {
        productKeys.add(filter.key);
      }
    }
  }

  const sourceTexts = [
    item?.compatibility,
    item?.fitment,
    item?.name,
    item?.description,
    item?.caption,
    item?.summary,
  ]
    .filter(Boolean)
    .map(String);
  const isUniversal =
    mappedKeys && mappedKeys.length > 1
      ? false
      : /全モデル|全車種|共通|all model/i.test(sourceTexts.join(" "));
  const isCommonAccessory = !isUniversal && productKeys.size === 0;
  const productLabels = [...productKeys]
    .map((key) => PRODUCT_FILTERS.find((filter) => filter.key === key)?.label)
    .filter(Boolean);
  const compatibilityLabel = isUniversal
    ? "全モデル対応"
    : productLabels.length > 0
      ? productLabels.join(" / ")
      : sourceTexts.find(Boolean) || "共通アクセサリー";

  return {
    productKeys: [...productKeys],
    productLabels,
    isUniversal,
    isCommonAccessory,
    compatibilityLabel,
  };
}

function normalizeCategoryKey(item) {
  const raw = String(
    item?.categoryCode ||
      item?.categoryLabel ||
      item?.categoryName ||
      item?.category?.name ||
      item?.category ||
      "",
  )
    .trim()
    .toLowerCase();
  if (raw) return raw.replace(/\s+/g, "-");

  const text = `${item?.name || ""} ${item?.description || ""}`.toLowerCase();
  if (text.includes("ヘルメット")) return "helmet";
  if (text.includes("ロック")) return "lock";
  if (
    text.includes("バッグ") ||
    text.includes("ストラップ") ||
    text.includes("フック")
  )
    return "bag";
  return "maintenance";
}

function formatFilterLabel(value) {
  const labels = {
    helmet: "HELMET",
    lock: "LOCK",
    bag: "BAG",
    maintenance: "MAINTENANCE",
  };
  return (
    labels[value] ||
    String(value || "")
      .replace(/-/g, " ")
      .toUpperCase()
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PRODUCT_FILTERS = [
  {
    key: "street",
    label: "eXs Street",
    patterns: ["17-exs-street", "exs street", "street-"],
  },
  {
    key: "tkg",
    label: "eXs 1 TKG",
    patterns: ["17-exs1tkg", "exs 1 tkg", "tkg", "exs1", "exs 1 "],
  },
  { key: "exs2", label: "eXs 2", patterns: ["17-exs2", "exs2", "exs 2"] },
  {
    key: "motolike",
    label: "MotoLike",
    patterns: ["motolike", "e-bike motolike"],
  },
];

// ID → モデルキーのマッピング（テキストパターンで判定できない商品用）
const ITEM_MODEL_MAP = {
  // eXs Street 用パーツ
  29282029: ["street"],
  29282012: ["street"],
  29184231: ["street"],
  29184224: ["street"],
  29184217: ["street"],
  29184194: ["street"],
  29184187: ["street"],
  29184170: ["street"],
  29184118: ["street"],
  29184101: ["street"],
  29184071: ["street"],
  29184064: ["street"],
  29184057: ["street"],
  29184040: ["street"],
  29184033: ["street"],
  29184026: ["street"],
  29184019: ["street"],
  29184002: ["street"],
  29183999: ["street"],
  29183982: ["street"],
  29183968: ["street"],
  29183913: ["street"],
  29183906: ["street"],
  29183890: ["street"],
  29183883: ["street"],
  29183876: ["street"],
  29183869: ["street"],
  28120285: ["street"],
  // eXs 1 TKG 用パーツ
  27878163: ["tkg"],
  27290255: ["tkg"],
  27294116: ["tkg"],
  27290262: ["tkg"],
  27290279: ["tkg"],
  // ヘルメット（両モデル共通）
  27687352: ["street", "tkg"],
  27687345: ["street", "tkg"],
  27687338: ["street", "tkg"],
};

const CATEGORY_PLACEHOLDER_COLORS = {
  helmet: { bg: "#f5f1eb", fg: "#4b3f35" },
  maintenance: { bg: "#eef4f6", fg: "#2b4b57" },
  bag: { bg: "#f2efe8", fg: "#5b5142" },
  lock: { bg: "#f1f1f1", fg: "#333333" },
  default: { bg: "#f7f7f7", fg: "#3a3a3a" },
};

function buildAccessoryPlaceholder(item) {
  const category = String(item?.category || "")
    .trim()
    .toLowerCase();
  const categoryLabel = String(item?.categoryLabel || category || "ACCESSORY")
    .trim()
    .toUpperCase();
  const name = String(item?.name || "eXs Accessory").trim();
  const colors =
    CATEGORY_PLACEHOLDER_COLORS[category] ||
    CATEGORY_PLACEHOLDER_COLORS.default;
  const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
            <rect width="600" height="450" fill="${colors.bg}"/>
            <rect x="36" y="36" width="528" height="378" rx="24" fill="none" stroke="${colors.fg}" stroke-opacity="0.18"/>
            <text x="300" y="168" text-anchor="middle" font-family="'Noto Sans JP', sans-serif" font-size="26" font-weight="700" fill="${colors.fg}" letter-spacing="3">${escapeXml(categoryLabel)}</text>
            <text x="300" y="238" text-anchor="middle" font-family="'Noto Sans JP', sans-serif" font-size="20" font-weight="500" fill="${colors.fg}">${escapeXml(truncateText(name, 28))}</text>
            <text x="300" y="286" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="16" fill="${colors.fg}" opacity="0.72">IMAGE PREPARING</text>
        </svg>
    `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// モックデータ (API実装までの仮データ)
function getMockData() {
  const items = [
    {
      id: "acc-001",
      name: "eXsダックテールヘルメット（マットブラック）",
      category: "helmet",
      categoryLabel: "HELMET",
      compatibility: "全モデル",
      description: "街乗りに馴染むダックテール形状。落ち着いたマットブラック。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-002",
      name: "eXsダックテールヘルメット（マットグレー）",
      category: "helmet",
      categoryLabel: "HELMET",
      compatibility: "全モデル",
      description: "軽快な印象のマットグレー。日常使いしやすい定番カラー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-003",
      name: "eXsダックテールヘルメット（マットアイボリー）",
      category: "helmet",
      categoryLabel: "HELMET",
      compatibility: "全モデル",
      description: "上品で柔らかな印象のマットアイボリー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },

    {
      id: "acc-004",
      name: "eXs Street フェンダーセット（前後）",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description:
        "泥はねを抑える純正フェンダーセット。日常走行での快適性を向上。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-005",
      name: "eXs Street リアキャリア",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description: "荷物積載をサポートする純正リアキャリア。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-006",
      name: "eXs Street 充電器",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description: "純正仕様の充電器。予備用としてもおすすめ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-007",
      name: "20×4.0 タイヤ",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description: "オンロード/オフロード両対応のファットタイヤ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-008",
      name: "20×4.0 ホワイトウォールタイヤ",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description: "クラシックなルックスを演出するホワイトウォール仕様。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },

    {
      id: "acc-009",
      name: "eXs 1 TKG サドル",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs 1 TKG",
      description: "長距離走行時の快適性を高める純正サドル。",
      url: "https://item.rakuten.co.jp/partsdirect39/28021582/",
    },
    {
      id: "acc-010",
      name: "eXs 1 TKG ハンドルバッグ（大）",
      category: "bag",
      categoryLabel: "BAG",
      compatibility: "eXs 1 TKG",
      description: "日用品やガジェットの収納に便利な大容量タイプ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-011",
      name: "eXs 1 TKG ハンドルバッグ（小）",
      category: "bag",
      categoryLabel: "BAG",
      compatibility: "eXs 1 TKG",
      description: "必要最低限をスマートに持ち運べるコンパクトタイプ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-012",
      name: "eXs 1 TKG コンビニフック",
      category: "bag",
      categoryLabel: "BAG",
      compatibility: "eXs 1 TKG",
      description: "買い物袋を掛けられる便利なフック。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-013",
      name: "eXs 1 TKG 持ち運びストラップセット",
      category: "bag",
      categoryLabel: "BAG",
      compatibility: "eXs 1 TKG",
      description: "折りたたみ時の持ち運びを快適にするストラップセット。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-014",
      name: "eXs 1 用充電器",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs 1 / eXs 1 TKG",
      description: "eXs 1シリーズ対応の純正充電器。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },

    {
      id: "acc-015",
      name: "TORUNA ワイヤーロック",
      category: "lock",
      categoryLabel: "LOCK",
      compatibility: "全モデル",
      description: "携帯しやすい定番ワイヤーロック。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-016",
      name: "TORUNA ジョイントロック",
      category: "lock",
      categoryLabel: "LOCK",
      compatibility: "全モデル",
      description: "取り回しやすさと防犯性を両立したジョイントタイプ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },

    {
      id: "acc-017",
      name: "スマートエアーマルチポンプ",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "全モデル",
      description: "携行しやすいマルチ対応エアポンプ。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-018",
      name: "WINDPRO P アルミフロアポンプ（ブラック）",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "全モデル",
      description: "高圧対応のアルミフロアポンプ。ブラックカラー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-019",
      name: "WINDPRO P アルミフロアポンプ（グレー）",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "全モデル",
      description: "高圧対応のアルミフロアポンプ。グレーカラー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-020",
      name: "WINDPRO P アルミフロアポンプ（レッド）",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "全モデル",
      description: "高圧対応のアルミフロアポンプ。レッドカラー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
    {
      id: "acc-021",
      name: "WINDPRO P アルミフロアポンプ（ブルー）",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "全モデル",
      description: "高圧対応のアルミフロアポンプ。ブルーカラー。",
      url: "https://item.rakuten.co.jp/partsdirect/",
    },
  ];

  return items.map((item) => {
    const isDefaultRakutenTop =
      item.url === "https://item.rakuten.co.jp/partsdirect/";
    const normalizedItem = {
      ...item,
      image: buildAccessoryPlaceholder(item),
      _isMock: true,
    };
    if (!isDefaultRakutenTop) return normalizedItem;
    return {
      ...normalizedItem,
      url: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(item.name)}/`,
    };
  });
}
