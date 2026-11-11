const TAX_RATE_PER_COMPONENT = 0.025;

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateOrderTax(subtotal: number, discount: number, deliveryFee: number) {
  const taxableAmount = roundMoney(Math.max(0, subtotal - discount) + deliveryFee);
  const cgstAmount = roundMoney(taxableAmount * TAX_RATE_PER_COMPONENT);
  const sgstAmount = roundMoney(taxableAmount * TAX_RATE_PER_COMPONENT);
  return {
    taxableAmount,
    cgstAmount,
    sgstAmount,
    totalAmount: roundMoney(taxableAmount + cgstAmount + sgstAmount),
  };
}
