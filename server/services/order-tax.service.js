const CGST_RATE = 0.025;
const SGST_RATE = 0.025;

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateOrderTax(subtotalAmount, discountAmount = 0, deliveryFee = 0) {
  const taxableAmount = roundMoney(
    Math.max(0, Number(subtotalAmount) - Number(discountAmount)) + Number(deliveryFee),
  );
  const cgstAmount = roundMoney(taxableAmount * CGST_RATE);
  const sgstAmount = roundMoney(taxableAmount * SGST_RATE);
  const taxAmount = roundMoney(cgstAmount + sgstAmount);
  return {
    taxableAmount,
    cgstAmount,
    sgstAmount,
    taxAmount,
    totalAmount: roundMoney(taxableAmount + taxAmount),
  };
}

module.exports = { CGST_RATE, SGST_RATE, calculateOrderTax };
