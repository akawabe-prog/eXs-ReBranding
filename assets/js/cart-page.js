import { ProductApiRequester } from "./services/product-api-requester-init.js";
import {
  initApiClient,
  init,
  fetchCart,
  addItemToCart,
  addItemsToCart,
  deleteCartItem,
} from "./api-client.js";

const EXCLUDED_ACCESSORY_IDS = new Set([
  "29044337",
  "29044351",
  "29044344",
  "27882603",
  "28021582",
  "28021599",
]);
const EXS_ACCESSORY_KEYWORDS = ["exs", "eXs", "e-bike", "ekickscooter"];
const STREET_VARIANTS = [
  {
    id: "29044337",
    label: "Matte Black",
    image: "/assets/images/img-webp/eXs street_item_matteblack.webp",
  },
  {
    id: "29044344",
    label: "Matte Gray",
    image: "/assets/images/img-webp/eXs street_item_mattegray.webp",
  },
  {
    id: "29044351",
    label: "Matte Beige",
    image: "/assets/images/img-webp/eXs street_item_mattebeige.webp",
  },
];
const TKG_VARIANTS = [
  { id: "27882603", label: "eXs 1 TKG (単品)" },
  { id: "28021582", label: "eXs 1 TKG + サドルセット" },
  { id: "28021599", label: "eXs 1 TKG + ハンドルバッグセット" },
];
const PURCHASE_PATHS = {
  street: "https://exs.customjapan.net/product/exs-street/purchase",
  tkg: "https://exs.customjapan.net/product/exs-1-tkg/purchase",
};

document.addEventListener("DOMContentLoaded", async () => {
  initApiClient(
    (window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl) || undefined,
  );

  try {
    await init();
  } catch (error) {
    console.warn("[cart-page] init failed", error);
  }

  bindEvents();
  await Promise.all([loadCart(), loadAccessories()]);
});

function bindEvents() {
  document
    .getElementById("reload-cart-btn")
    ?.addEventListener("click", async () => {
      await loadCart(true);
    });
}

async function loadCart(showReloadMessage = false) {
  toggleLoading(true);
  if (showReloadMessage) {
    setAlert("カートを再読み込みしました。", "info");
  } else {
    clearAlert();
  }

  try {
    const cart = await fetchCart();
    renderCart(cart);
    window.dispatchEvent(new CustomEvent("exs:cart-updated"));
  } catch (error) {
    console.error("[cart-page] fetchCart failed", error);
    renderError();
    setAlert("カート情報の取得に失敗しました。", "error");
  } finally {
    toggleLoading(false);
  }
}

function renderCart(cart) {
  const cartData = unwrapCartData(cart);
  const details = Array.isArray(cartData?.details) ? cartData.details : [];
  const listEl = document.getElementById("cart-list");
  const emptyEl = document.getElementById("cart-empty");

  if (!listEl || !emptyEl) return;

  if (details.length === 0) {
    listEl.classList.add("hidden");
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    updateSummary([]);
    return;
  }

  emptyEl.classList.add("hidden");
  listEl.classList.remove("hidden");
  listEl.innerHTML = details.map((detail) => createCartRow(detail)).join("");

  listEl.querySelectorAll('[data-action="increase"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("[data-cart-row]");
      const detail = parseDetailPayload(row);
      const productId = getDetailItemId(detail);
      if (!productId) {
        setAlert("商品IDが取得できないため数量追加できません。", "error");
        return;
      }
      await withRowLoading(row, async () => {
        const result = await addItemToCart(productId, 1);
        if (result?.result === "error") {
          throw new Error(
            result.errors?.[0]?.abstract || "数量追加に失敗しました。",
          );
        }
        await loadCart();
        setAlert("数量を追加しました。", "success");
      });
    });
  });

  listEl.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("[data-cart-row]");
      const detail = parseDetailPayload(row);
      await withRowLoading(row, async () => {
        const result = await deleteCartItem([detail]);
        if (result?.result === "error") {
          throw new Error(
            result.errors?.[0]?.abstract || "削除に失敗しました。",
          );
        }
        await loadCart();
        setAlert("商品を削除しました。", "success");
      });
    });
  });

  listEl.querySelectorAll('[data-action="replace"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("[data-cart-row]");
      const detail = parseDetailPayload(row);
      const select = row?.querySelector("[data-variant-select]");
      const nextId = select?.value;
      const currentId = getDetailItemId(detail);
      if (!nextId || nextId === currentId) return;

      await withRowLoading(row, async () => {
        const deleteResult = await deleteCartItem([detail]);
        if (deleteResult?.result === "error") {
          throw new Error(
            deleteResult.errors?.[0]?.abstract ||
              "商品の入れ替えに失敗しました。",
          );
        }

        const addResult = await addItemsToCart([
          { id: nextId, quantity: getDetailQuantity(detail) },
        ]);
        if (addResult?.result === "error") {
          throw new Error(
            addResult.errors?.[0]?.abstract || "商品の入れ替えに失敗しました。",
          );
        }

        await loadCart();
        setAlert("カート内の商品を入れ替えました。", "success");
      });
    });
  });

  updateSummary(details);
}

function createCartRow(detail) {
  const title = escapeHtml(getDetailName(detail));
  const image = escapeHtml(getDetailImage(detail));
  const quantity = getDetailQuantity(detail);
  const unitPrice = getDetailUnitPrice(detail);
  const subtotal = getDetailSubtotal(detail);
  const code = escapeHtml(getDetailCode(detail));
  const payload = encodeURIComponent(JSON.stringify(detail));
  const variantControl = createVariantControl(detail);

  return `
        <article class="px-6 py-6 md:px-8 md:py-8" data-cart-row data-detail="${payload}">
            <div class="grid md:grid-cols-[132px_minmax(0,1fr)] gap-5 items-start">
                <div class="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
                    ${image ? `<img src="${image}" alt="${title}" class="w-full h-full object-cover">` : '<span class="font-en text-xs tracking-widest text-gray-400">NO IMAGE</span>'}
                </div>
                <div>
                    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <p class="font-en text-[11px] tracking-widest text-gray-400 mb-2">${code || "ITEM"}</p>
                            <h3 class="text-lg font-bold leading-relaxed">${title}</h3>
                        </div>
                        <p class="font-en text-2xl font-bold whitespace-nowrap">${formatYen(subtotal)}</p>
                    </div>
                    <div class="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div class="text-sm text-gray-500">
                            <span>単価 ${formatYen(unitPrice)}</span>
                            <span class="mx-2 text-gray-300">/</span>
                            <span>数量 ${quantity}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <button type="button" data-action="increase" class="h-11 px-4 border border-gray-300 text-sm font-en tracking-widest hover:bg-gray-50 transition">+1 ADD</button>
                            <button type="button" data-action="delete" class="h-11 px-4 border border-red-200 text-red-600 text-sm font-en tracking-widest hover:bg-red-50 transition">DELETE</button>
                        </div>
                    </div>
                    ${variantControl}
                </div>
            </div>
        </article>
    `;
}

function createVariantControl(detail) {
  const currentId = getDetailItemId(detail);
  const family = getVariantFamily(detail);
  if (!family) return "";

  const label = family.type === "street" ? "COLOR" : "SET TYPE";
  const current = family.variants.find((variant) => variant.id === currentId);
  const options = family.variants
    .map(
      (variant) => `
        <option value="${variant.id}" ${variant.id === currentId ? "selected" : ""}>${escapeHtml(variant.label)}</option>
    `,
    )
    .join("");

  const preview =
    family.type === "street" && current?.image
      ? `<img src="${escapeHtml(current.image)}" alt="${escapeHtml(current.label)}" class="w-20 h-20 rounded-xl object-cover border border-gray-200">`
      : `<div class="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-en tracking-widest text-gray-400">${label}</div>`;

  return `
        <div class="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p class="font-en text-[11px] tracking-widest text-gray-400 mb-3">${label}</p>
            <div class="flex flex-col md:flex-row md:items-center gap-4">
                ${preview}
                <div class="flex-1">
                    <p class="text-sm text-gray-500 mb-2">現在: ${escapeHtml(current?.label || getDetailName(detail))}</p>
                    <div class="flex flex-col sm:flex-row gap-3">
                        <select data-variant-select class="h-11 w-full border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:border-black">
                            ${options}
                        </select>
                        <button type="button" data-action="replace" class="h-11 px-5 bg-brand-black text-white text-sm font-en tracking-widest hover:opacity-85 transition">CHANGE</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getVariantFamily(detail) {
  const itemId = getDetailItemId(detail);
  if (STREET_VARIANTS.some((variant) => variant.id === itemId)) {
    return { type: "street", variants: STREET_VARIANTS };
  }
  if (TKG_VARIANTS.some((variant) => variant.id === itemId)) {
    return { type: "tkg", variants: TKG_VARIANTS };
  }
  return null;
}

async function loadAccessories() {
  toggleAccessoriesLoading(true);
  try {
    const accessories = await fetchAccessoriesData();
    renderAccessories(accessories);
  } catch (error) {
    console.error("[cart-page] accessories fetch failed", error);
    renderAccessoryError();
  } finally {
    toggleAccessoriesLoading(false);
  }
}

async function fetchAccessoriesData() {
  try {
    const queryApiUrl = new URLSearchParams(window.location.search).get("api");
    const configuredApiUrl =
      window.EXS_API_CONFIG && window.EXS_API_CONFIG.accessoriesUrl;
    const apiUrl = queryApiUrl || configuredApiUrl;

    let rawItems;
    if (apiUrl) {
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
      const json = await response.json();
      rawItems = json.data || json.products || json.items || json;
    } else {
      const response = await ProductApiRequester.fetchAccessories();
      rawItems =
        response?.data || response?.products || response?.items || response;
    }

    if (!Array.isArray(rawItems))
      throw new Error("Accessories API returned invalid payload");

    return rawItems
      .map(normalizeAccessory)
      .filter(isExsAccessory)
      .filter((item) => !EXCLUDED_ACCESSORY_IDS.has(String(item.id || "")))
      .filter((item) => item.name && item.image && item.description);
  } catch (error) {
    console.warn(
      "[cart-page] accessories API fetch failed, fallback data is used.",
      error,
    );
    return getAccessoryMockData()
      .map((item) => ({ ...item, _isMock: true }))
      .filter(isExsAccessory)
      .filter((item) => !EXCLUDED_ACCESSORY_IDS.has(String(item.id || "")))
      .filter((item) => item.name && item.image && item.description);
  }
}

function renderAccessories(items) {
  const grid = document.getElementById("cart-accessories-grid");
  const empty = document.getElementById("cart-accessories-empty");
  if (!grid || !empty) return;

  if (!items || items.length === 0) {
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
    empty.textContent = "表示できるアクセサリーがありません。";
    return;
  }

  empty.classList.add("hidden");
  grid.classList.remove("hidden");
  grid.innerHTML = items
    .map(
      (item) => `
        <article class="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <div class="aspect-[4/3] bg-gray-50">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover">
            </div>
            <div class="p-5">
                <p class="font-en text-[11px] tracking-widest text-gray-400 mb-2">${escapeHtml(item.categoryLabel || item.category)}</p>
                <h3 class="text-base font-bold leading-relaxed mb-2">${escapeHtml(item.name)}</h3>
                <p class="text-xs font-bold text-gray-500 mb-3">対応: ${escapeHtml(item.compatibility || "全モデル")}</p>
                <p class="text-sm text-gray-600 leading-relaxed mb-5">${escapeHtml(item.description)}</p>
                <button type="button" class="w-full h-11 border text-sm font-en tracking-widest transition ${item._isMock ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed" : "border-brand-black hover:bg-brand-black hover:text-white"}" data-accessory-add="${escapeHtml(item.id || "")}" ${item._isMock ? "disabled" : ""}>${item._isMock ? "API準備中" : "ADD TO CART"}</button>
                <p class="hidden mt-3 text-xs text-center" data-accessory-message></p>
            </div>
        </article>
    `,
    )
    .join("");

  grid.querySelectorAll("[data-accessory-add]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = button.getAttribute("data-accessory-add");
      const messageEl = button.parentElement?.querySelector(
        "[data-accessory-message]",
      );
      if (button.disabled) {
        setInlineMessage(
          messageEl,
          "アクセサリーAPI接続後にカート追加できるようになります。",
          "info",
        );
        return;
      }
      if (!itemId) {
        setInlineMessage(messageEl, "商品IDが取得できません。", "error");
        return;
      }

      button.disabled = true;
      button.classList.add("opacity-60", "cursor-not-allowed");
      setInlineMessage(messageEl, "カートに追加中です...", "info");
      try {
        const result = await addItemToCart(itemId, 1);
        if (result?.result === "error") {
          throw new Error(
            result.errors?.[0]?.abstract || "カート追加に失敗しました。",
          );
        }
        setInlineMessage(messageEl, "カートに追加しました。", "success");
        await loadCart();
      } catch (error) {
        console.error("[cart-page] accessory add failed", error);
        setInlineMessage(
          messageEl,
          error.message || "カート追加に失敗しました。",
          "error",
        );
      } finally {
        button.disabled = false;
        button.classList.remove("opacity-60", "cursor-not-allowed");
      }
    });
  });
}

function renderAccessoryError() {
  const grid = document.getElementById("cart-accessories-grid");
  const empty = document.getElementById("cart-accessories-empty");
  if (grid) {
    grid.classList.add("hidden");
    grid.innerHTML = "";
  }
  if (empty) {
    empty.classList.remove("hidden");
    empty.textContent = "アクセサリー情報を取得できませんでした。";
  }
}

function toggleAccessoriesLoading(isLoading) {
  document
    .getElementById("cart-accessories-loading")
    ?.classList.toggle("hidden", !isLoading);
}

function updateSummary(details) {
  const count = details.reduce(
    (sum, detail) => sum + getDetailQuantity(detail),
    0,
  );
  const subtotal = details.reduce(
    (sum, detail) => sum + getDetailSubtotal(detail),
    0,
  );

  setText("summary-count", String(count));
  setText("summary-subtotal", formatYen(subtotal));
  setText("summary-total", formatYen(subtotal));
  updateCheckoutAction(details);
}

function renderError() {
  const listEl = document.getElementById("cart-list");
  const emptyEl = document.getElementById("cart-empty");
  if (listEl) {
    listEl.classList.add("hidden");
    listEl.innerHTML = "";
  }
  if (emptyEl) {
    emptyEl.classList.remove("hidden");
    emptyEl.innerHTML = `
            <p class="font-en text-2xl tracking-widest mb-4">CART UNAVAILABLE</p>
            <p class="text-sm text-gray-500 mb-8">時間をおいて再度お試しください。</p>
            <a href="https://exs.customjapan.net/accessories" class="inline-block border border-brand-black px-6 py-3 text-sm font-en tracking-widest hover:bg-brand-black hover:text-white transition">ACCESSORIES</a>
        `;
  }
  updateSummary([]);
}

function toggleLoading(isLoading) {
  document
    .getElementById("cart-loading")
    ?.classList.toggle("hidden", !isLoading);
}

async function withRowLoading(row, action) {
  if (!row) return;
  row.classList.add("opacity-60", "pointer-events-none");
  try {
    await action();
  } catch (error) {
    console.error("[cart-page] row action failed", error);
    setAlert(error.message || "操作に失敗しました。", "error");
  } finally {
    row.classList.remove("opacity-60", "pointer-events-none");
  }
}

function setAlert(message, type = "info") {
  const alertEl = document.getElementById("cart-alert");
  if (!alertEl) return;

  alertEl.className = "mb-6 rounded-2xl border px-4 py-3 text-sm";
  if (type === "error") {
    alertEl.classList.add("border-red-200", "bg-red-50", "text-red-600");
  } else if (type === "success") {
    alertEl.classList.add("border-green-200", "bg-green-50", "text-green-700");
  } else {
    alertEl.classList.add("border-gray-200", "bg-white", "text-gray-600");
  }
  alertEl.textContent = message;
  alertEl.classList.remove("hidden");
}

function clearAlert() {
  document.getElementById("cart-alert")?.classList.add("hidden");
}

function setInlineMessage(element, message, type = "info") {
  if (!element) return;
  element.className = "mt-3 text-xs text-center";
  if (type === "error") {
    element.classList.add("text-red-500");
  } else if (type === "success") {
    element.classList.add("text-green-600");
  } else {
    element.classList.add("text-gray-500");
  }
  element.textContent = message;
  element.classList.remove("hidden");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateCheckoutAction(details) {
  const button = document.getElementById("cart-checkout-btn");
  const note = document.getElementById("cart-checkout-note");
  if (!button || !note) return;

  const families = new Set(
    (Array.isArray(details) ? details : [])
      .map((detail) => inferCheckoutFamily(detail))
      .filter(Boolean),
  );

  button.classList.add("hidden");
  note.classList.add("hidden");
  button.disabled = false;
  button.onclick = null;

  if (families.size === 0) return;

  if (families.size > 1) {
    note.textContent =
      "Street系と1 TKG系の商品が同時に入っています。購入前にどちらかの購入フローに整理してください。";
    note.classList.remove("hidden");
    return;
  }

  const family = [...families][0];
  const path = PURCHASE_PATHS[family];
  if (!path) return;

  button.textContent =
    family === "street"
      ? "PROCEED TO STREET PURCHASE"
      : "PROCEED TO TKG PURCHASE";
  button.onclick = () => {
    window.location.href = path;
  };
  button.classList.remove("hidden");
}

function parseDetailPayload(row) {
  try {
    return JSON.parse(decodeURIComponent(row?.dataset.detail || ""));
  } catch (error) {
    return {};
  }
}

function getDetailName(detail) {
  return (
    detail?.name ||
    detail?.itemName ||
    detail?.productName ||
    detail?.label ||
    detail?.item?.name ||
    "商品"
  );
}

function getDetailCode(detail) {
  return (
    detail?.id ||
    detail?.itemId ||
    detail?.productId ||
    detail?.sku ||
    detail?.cd ||
    detail?.item?.id ||
    ""
  );
}

function getDetailImage(detail) {
  const image =
    detail?.image ||
    detail?.imgUrl ||
    detail?.imageUrl ||
    detail?.thumbnail ||
    detail?.thumb ||
    detail?.item?.image ||
    detail?.item?.imageUrl ||
    detail?.item?.thumbnail ||
    "";
  if (image) return image;

  const family = getVariantFamily(detail);
  if (family?.type === "street") {
    const current = family.variants.find(
      (variant) => variant.id === getDetailItemId(detail),
    );
    return current?.image || "";
  }
  if (family?.type === "tkg") {
    return "/assets/images/img-webp/eXs 1 TKG_item_display.webp";
  }
  return "";
}

function getDetailItemId(detail) {
  return String(
    detail?.id || detail?.itemId || detail?.productId || detail?.item?.id || "",
  ).trim();
}

function getDetailQuantity(detail) {
  const quantity = Number(
    detail?.quantity ??
      detail?.cnt ??
      detail?.count ??
      detail?.item?.quantity ??
      1,
  );
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getDetailUnitPrice(detail) {
  const candidates = [
    detail?.price,
    detail?.unitPrice,
    detail?.salesPrice,
    detail?.sellingPrice,
    detail?.priceWithTax,
    detail?.price?.taxIn,
    detail?.price?.taxEx,
    detail?.unitPrice?.taxIn,
    detail?.item?.price,
    detail?.item?.price?.taxIn,
  ];
  for (const value of candidates) {
    const price = Number(value);
    if (Number.isFinite(price) && price >= 0) return price;
  }
  const subtotal = Number(
    detail?.subtotal?.taxIn ??
      detail?.subtotal ??
      detail?.amount ??
      detail?.totalPrice?.taxIn ??
      detail?.totalPrice,
  );
  const quantity = getDetailQuantity(detail);
  if (Number.isFinite(subtotal) && quantity > 0) {
    return Math.round(subtotal / quantity);
  }
  return 0;
}

function getDetailSubtotal(detail) {
  const candidates = [
    detail?.subtotal,
    detail?.amount,
    detail?.totalPrice,
    detail?.amountWithTax,
    detail?.subtotal?.taxIn,
    detail?.subtotal?.taxEx,
    detail?.total?.taxIn,
    detail?.total?.taxEx,
  ];
  for (const value of candidates) {
    const price = Number(value);
    if (Number.isFinite(price) && price >= 0) return price;
  }
  return getDetailUnitPrice(detail) * getDetailQuantity(detail);
}

function normalizeAccessory(item) {
  return {
    id: item?.id || item?.productId || item?.code || "",
    name: item?.name || item?.productName || "",
    category: item?.category || item?.categoryCode || "",
    categoryLabel:
      item?.categoryLabel || item?.categoryName || item?.category || "",
    compatibility: item?.compatibility || item?.fitment || "全モデル",
    description: item?.description || item?.caption || item?.summary || "",
    image: item?.image || item?.imageUrl || item?.thumbnail || "",
    url: item?.url || item?.productUrl || "",
  };
}

function unwrapCartData(cart) {
  return cart?.data || cart;
}

function inferCheckoutFamily(detail) {
  const itemId = getDetailItemId(detail);
  if (STREET_VARIANTS.some((variant) => variant.id === itemId)) return "street";
  if (TKG_VARIANTS.some((variant) => variant.id === itemId)) return "tkg";

  const haystack =
    `${getDetailName(detail)} ${getDetailCode(detail)}`.toLowerCase();
  if (haystack.includes("street")) return "street";
  if (
    haystack.includes("tkg") ||
    haystack.includes("exs1") ||
    haystack.includes("exs 1")
  )
    return "tkg";
  return "";
}

function isExsAccessory(item) {
  const haystack =
    `${item?.name || ""} ${item?.description || ""} ${item?.compatibility || ""}`.toLowerCase();
  return EXS_ACCESSORY_KEYWORDS.some((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );
}

function formatYen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAccessoryMockData() {
  return [
    {
      id: "29044360",
      name: "eXs Street 専用フェンダーセット",
      category: "maintenance",
      categoryLabel: "MAINTENANCE",
      compatibility: "eXs Street",
      description: "雨天や通勤時に便利な純正フェンダーセット。",
      image: "/assets/images/img-webp/eXs-street_item_front.webp",
    },
    {
      id: "28021582",
      name: "eXs 1 TKG サドルセット",
      category: "bag",
      categoryLabel: "OPTION",
      compatibility: "eXs 1 TKG",
      description: "快適性を高めるサドルセット。",
      image: "/assets/images/img-webp/eXs-1-TKG_item_sadle.webp",
    },
    {
      id: "29044370",
      name: "eXs オリジナルロック",
      category: "lock",
      categoryLabel: "LOCK",
      compatibility: "全モデル",
      description: "eXs ロゴ入りの携帯しやすいロック。",
      image: "/assets/images/img-webp/eXs-1-TKG_item_1.webp",
    },
  ];
}
