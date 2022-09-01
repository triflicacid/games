/**
 * Play a "card slide" sound
 */
function playCardSlide() {
  const n = Math.floor(Math.random() * 8) + 1;
  Sounds.play(`cardSlide${n}`);
  return n;
}

/**
 * Play a "card place" sound
 */
function playCardPlace() {
  const n = Math.floor(Math.random() * 4) + 1;
  Sounds.play(`cardPlace${n}`);
  return n;
}

/**
 * Play a "card take out pack" sound
 */
function playCardTakeOutPack() {
  const n = Math.random() <= 0.5 ? 1 : 2;
  Sounds.play(`cardTakeOutPack${n}`);
  return n;
}