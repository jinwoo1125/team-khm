const adjectives = [
  '신비로운', '달콤한', '차가운', '뜨거운', '조용한',
];

const nouns = [
  '멜로디', '리듬', '비트', '음표', '화음',
];

function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

module.exports = { generateNickname };
