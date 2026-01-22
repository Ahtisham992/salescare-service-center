// frontend/src/utils/numberToWords.js

/**
 * Convert number to words (Pakistani Rupees)
 * Supports up to crores (10,000,000)
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Convert a number less than 1000 to words
 */
const convertHundreds = (num) => {
  let result = '';

  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 10 && num <= 19) {
    result += teens[num - 10] + ' ';
  } else if (num >= 20 || num > 0) {
    result += tens[Math.floor(num / 10)] + ' ';
    result += ones[num % 10] + ' ';
  }

  return result.trim();
};

/**
 * Convert number to words in Pakistani numbering system
 * @param {number} amount - The amount to convert
 * @returns {string} - Amount in words
 */
export const numberToWords = (amount) => {
  if (!amount || amount === 0) return 'Zero Rupees Only';

  // Separate rupees and paisa
  const [rupees, paisa] = amount.toString().split('.');
  const rupeesNum = parseInt(rupees, 10);
  const paisaNum = paisa ? parseInt(paisa.padEnd(2, '0').substring(0, 2), 10) : 0;

  let result = '';

  // Handle negative numbers
  if (rupeesNum < 0) {
    return 'Invalid Amount';
  }

  // Crores (10,000,000)
  if (rupeesNum >= 10000000) {
    const crores = Math.floor(rupeesNum / 10000000);
    result += convertHundreds(crores) + ' Crore ';
  }

  // Lakhs (100,000)
  const remainder1 = rupeesNum % 10000000;
  if (remainder1 >= 100000) {
    const lakhs = Math.floor(remainder1 / 100000);
    result += convertHundreds(lakhs) + ' Lakh ';
  }

  // Thousands (1,000)
  const remainder2 = remainder1 % 100000;
  if (remainder2 >= 1000) {
    const thousands = Math.floor(remainder2 / 1000);
    result += convertHundreds(thousands) + ' Thousand ';
  }

  // Hundreds, tens, and ones
  const remainder3 = remainder2 % 1000;
  if (remainder3 > 0) {
    result += convertHundreds(remainder3) + ' ';
  }

  // Add "Rupees"
  result = result.trim() + ' Rupees';

  // Add paisa if exists
  if (paisaNum > 0) {
    result += ' and ' + convertHundreds(paisaNum) + ' Paisa';
  }

  // Add "Only"
  result += ' Only';

  return result;
};

/**
 * Format currency with words
 * @param {number} amount - The amount
 * @returns {object} - { numeric, words }
 */
export const formatCurrencyWithWords = (amount) => {
  const num = parseFloat(amount) || 0;
  
  return {
    numeric: `Rs. ${num.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    words: numberToWords(num)
  };
};

/**
 * Quick test function (can be removed in production)
 */
export const testNumberToWords = () => {
  const tests = [
    0,
    5,
    15,
    99,
    100,
    150,
    999,
    1000,
    1500,
    10000,
    99999,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    12345678.50
  ];

  console.log('=== Number to Words Tests ===');
  tests.forEach(num => {
    console.log(`${num} => ${numberToWords(num)}`);
  });
};

export default numberToWords;