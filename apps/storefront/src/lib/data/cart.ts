import { medusa } from "@/lib/medusa";

export async function createCart(regionId: string) {
  const { cart } = await medusa.store.cart.create({ region_id: regionId });
  return cart;
}

export async function getCart(id: string) {
  const { cart } = await medusa.store.cart.retrieve(id);
  return cart;
}

export async function addToCart(cartId: string, variantId: string, quantity = 1) {
  const { cart } = await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });
  return cart;
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
) {
  const { cart } = await medusa.store.cart.updateLineItem(
    cartId,
    lineItemId,
    { quantity }
  );
  return cart;
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  const { parent: cart } = await medusa.store.cart.deleteLineItem(
    cartId,
    lineItemId
  );
  return cart;
}
