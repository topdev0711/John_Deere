const convert1DTo2DArray = (oneDArray, innerArraySize) => {
  let finalArray = [];
  for (let i = 0; i < oneDArray.length; i += innerArraySize) {
    let temp = oneDArray.slice(i, i + innerArraySize);
    finalArray.push(temp);
  }
  return finalArray;
}


module.exports = { convert1DTo2DArray };
