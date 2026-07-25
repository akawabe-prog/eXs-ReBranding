import { initApiClient, init } from './api-client.js';
import { ProductApiRequester } from './services/product-api-requester.js';

const formatYen = (value) => `${Number(value || 0).toLocaleString('ja-JP')}円`;

const rawItem = (item) => item?.item || item?.data || item || {};

const itemId = (item) => String(
  rawItem(item).id ||
  rawItem(item).itemId ||
  rawItem(item).productId ||
  rawItem(item).code ||
  rawItem(item).itemCode ||
  rawItem(item).sku ||
  '',
).trim();

const normalizePrice = (item) => {
  const raw = rawItem(item);
  const price = raw.price || {};
  const sale = price.sale || raw.sale || {};
  const campaign = price.campaign || raw.campaign || {};
  const promotion = price.promotion || raw.promotion || {};
  const discount = price.discount || raw.discount || {};
  const candidates = [
    raw.campaignPriceTaxIn,
    raw.campaignTaxIn,
    raw.campaignPrice,
    raw.priceCampaignTaxIn,
    campaign.pc?.taxIn,
    campaign.sp?.taxIn,
    campaign.taxIn,
    campaign.priceTaxIn,
    campaign.price,
    campaign.value,
    raw.promotionPriceTaxIn,
    raw.promotionTaxIn,
    raw.promotionPrice,
    promotion.pc?.taxIn,
    promotion.sp?.taxIn,
    promotion.taxIn,
    promotion.priceTaxIn,
    promotion.price,
    promotion.value,
    raw.discountPriceTaxIn,
    raw.discountedPriceTaxIn,
    raw.discountPrice,
    raw.discountedPrice,
    discount.pc?.taxIn,
    discount.sp?.taxIn,
    discount.taxIn,
    discount.priceTaxIn,
    discount.price,
    discount.value,
    raw.salePriceTaxIn,
    raw.saleTaxIn,
    raw.salesPriceTaxIn,
    sale.pc?.taxIn,
    sale.sp?.taxIn,
    sale.taxIn,
    sale.priceTaxIn,
    sale.price,
    sale.value,
    price.current,
    price.selling,
    raw.priceTaxIn,
    raw.taxInPrice,
    raw.priceInTax,
    raw.taxIncludedPrice,
    raw.priceWithTax,
    raw.sellingPrice,
    raw.sellingPriceTaxIn,
    raw.defaultPrice,
    raw.webPrice,
    price.taxIn,
    price.taxInPrice,
    price.priceTaxIn,
    price.taxIncluded,
    price.withTax,
    price.default,
    price.value,
    typeof raw.price === 'number' ? raw.price : null,
    raw.unitPrice,
    raw.salesPrice,
    raw.salePrice,
    raw.retailPrice,
  ];

  for (const value of candidates) {
    const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const extractItems = (payload) => {
  const candidates = [
    payload?.data,
    payload?.items,
    payload?.data?.items,
    payload?.data?.list,
    payload?.list,
    payload?.products,
    payload,
  ];
  return candidates.find(Array.isArray) || [];
};

document.addEventListener('DOMContentLoaded', async () => {
  const priceEls = Array.from(document.querySelectorAll('[data-api-price-item-id]'));
  if (priceEls.length === 0) return;

  const ids = Array.from(new Set(
    priceEls.map((el) => String(el.dataset.apiPriceItemId || '').trim()).filter(Boolean),
  ));
  if (ids.length === 0) return;

  const config = window.EXS_API_CONFIG || {};
  initApiClient(config.apiBaseUrl || undefined, config.initApiBaseUrl || undefined);

  try {
    await init();
    const payload = await ProductApiRequester.fetchItems(ids);
    const priceMap = new Map();
    extractItems(payload).forEach((item) => {
      const id = itemId(item);
      const price = normalizePrice(item);
      if (id && price) priceMap.set(id, price);
    });

    priceEls.forEach((el) => {
      const id = String(el.dataset.apiPriceItemId || '').trim();
      const price = priceMap.get(id) || Number(el.dataset.fallbackPrice || 0);
      if (Number.isFinite(price) && price > 0) el.textContent = formatYen(price);
    });
  } catch (error) {
    console.warn('[api-price-display] price API fetch failed. fallback price is used.', error);
  }
});
