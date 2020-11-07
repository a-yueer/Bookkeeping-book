export const formatNumber = (num: any, toFixed: number | undefined) => {
  let numberString = (num || 0).toString();
  let decimal;
  if (numberString.includes('.')) {
    if (toFixed) {
      decimal = Number(numberString).toFixed(toFixed).split('.')[1];
    } else {
      decimal = '';
    }
    numberString = numberString.split('.')[0];
  } else if (toFixed && toFixed > 0) {
    decimal = new Array(toFixed).fill('0').join('');
  }
  let result = '';
  while (numberString.length > 3) {
    result = `,${numberString.slice(-3)}${result}`;
    numberString = numberString.slice(0, numberString.length - 3);
  }
  if (numberString) {
    result = numberString + result;
  }
  if (decimal) {
    result = `${result}.${decimal}`;
  }
  return result;
};
