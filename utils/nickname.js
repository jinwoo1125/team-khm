const adjectives = [
  '신비로운', '달콤한', '차가운', '뜨거운', '조용한', '시끄러운', '빠른', '느린',
  '화려한', '수줍은', '용감한', '엉뚱한', '귀여운', '멋진', '따뜻한', '서늘한',
  '졸린', '활발한', '섬세한', '거친', '부드러운', '날카로운', '몽환적인', '청량한',
];

const nouns = [
  '멜로디', '리듬', '비트', '음표', '화음', '선율', '박자', '음악',
  '피아노', '기타', '드럼', '바이올린', '첼로', '트럼펫', '플루트', '색소폰',
  '무대', '앙코르', '콘서트', '레코드', '음반', '스튜디오', '마이크', '스피커',
];

function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

module.exports = { generateNickname };
