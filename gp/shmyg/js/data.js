/* Держи Шмыга! · данные игры: миры, костюмы, бусты, задания, сундуки. Все числа баланса — здесь. */
window.DATA = (function () {
  "use strict";

  /* ---- Миры. sky/ground — цвета для интерфейса; вид мира в 3D — worlds.js. Открытие: N построек в предыдущем мире или монеты. ---- */
  var WORLDS = [
    { id: "town", name: { ru: "Златоград", en: "Goldtown" }, ready: true, sky: 0x8fd3ff, ground: 0x7ccf5a,
      unlock: { builds: 0, coins: 0 },
      buildings: [{ id: "fountain", name: { ru: "Фонтан", en: "Fountain" }, color: 0x48b6ff }, { id: "post", name: { ru: "Почта", en: "Post Office" }, color: 0xff8a3d }, { id: "bakery", name: { ru: "Пекарня", en: "Bakery" }, color: 0xf7c86a }, { id: "clock", name: { ru: "Часовая башня", en: "Clock Tower" }, color: 0xc56cf0 }, { id: "carousel", name: { ru: "Карусель", en: "Carousel" }, color: 0xff5fa2 }] },
    { id: "dunes", name: { ru: "Песчаные барханы", en: "Dune Valley" }, ready: true, sky: 0xffd59a, ground: 0xf2c46b,
      unlock: { builds: 6, coins: 5000 },
      buildings: [{ id: "well", name: { ru: "Колодец", en: "Well" }, color: 0x3fb2d9 }, { id: "market", name: { ru: "Базар", en: "Bazaar" }, color: 0xff7a4a }, { id: "palm", name: { ru: "Оазис", en: "Oasis" }, color: 0x3fbf6a }, { id: "temple", name: { ru: "Храм солнца", en: "Sun Temple" }, color: 0xffc23d }, { id: "tower", name: { ru: "Маяк пустыни", en: "Desert Beacon" }, color: 0xb36ae6 }] },
    { id: "snow", name: { ru: "Снежный перевал", en: "Frosty Pass" }, ready: true, sky: 0xa9d8f5, ground: 0xf4f9ff,
      unlock: { builds: 6, coins: 12000 },
      buildings: [{ id: "rink", name: { ru: "Каток", en: "Ice Rink" }, color: 0x7fd3ff }, { id: "chalet", name: { ru: "Шале", en: "Chalet" }, color: 0xb0703f }, { id: "lift", name: { ru: "Канатка", en: "Ski Lift" }, color: 0xff5a5a }, { id: "tree", name: { ru: "Большая ель", en: "Great Fir" }, color: 0x2fae6a }, { id: "observatory", name: { ru: "Обсерватория", en: "Observatory" }, color: 0x7a6af0 }] },
    { id: "jungle", name: { ru: "Изумрудные джунгли", en: "Emerald Jungle" }, ready: true, sky: 0x9be38a, ground: 0x3e6a2e,
      unlock: { builds: 6, coins: 20000 },
      buildings: [{ id: "bridge", name: { ru: "Верёвочный мост", en: "Rope Bridge" }, color: 0xc8964a }, { id: "treehouse", name: { ru: "Дом на дереве", en: "Tree House" }, color: 0x6aa84a }, { id: "gate", name: { ru: "Врата храма", en: "Temple Gate" }, color: 0x9aa08a }, { id: "mill", name: { ru: "Водяная мельница", en: "Water Mill" }, color: 0x4ab8e8 }, { id: "totems", name: { ru: "Сад тотемов", en: "Totem Garden" }, color: 0xe8783a }] },
    { id: "harbor", name: { ru: "Солнечный порт", en: "Sunny Harbor" }, ready: true, sky: 0x7fd0ff, ground: 0x2a6a9a,
      unlock: { builds: 6, coins: 30000 },
      buildings: [{ id: "lighthouse", name: { ru: "Маяк", en: "Lighthouse" }, color: 0xe84a3a }, { id: "fishmarket", name: { ru: "Рыбный рынок", en: "Fish Market" }, color: 0x3a9ad8 }, { id: "shipyard", name: { ru: "Верфь", en: "Shipyard" }, color: 0xb8864a }, { id: "wheel", name: { ru: "Колесо обозрения", en: "Ferris Wheel" }, color: 0xff6ab8 }, { id: "office", name: { ru: "Управление порта", en: "Harbor Office" }, color: 0x5a6ad8 }] },
    { id: "mine", name: { ru: "Огненная шахта", en: "Ember Mine" }, ready: true, sky: 0xff9a5a, ground: 0x3a2a20,
      unlock: { builds: 6, coins: 45000 },
      buildings: [{ id: "crystals", name: { ru: "Лавка кристаллов", en: "Crystal Shop" }, color: 0x2affd0 }, { id: "elevator", name: { ru: "Подъёмник", en: "Mine Elevator" }, color: 0x9a9aa8 }, { id: "forge", name: { ru: "Кузница", en: "Forge" }, color: 0xff7a2a }, { id: "station", name: { ru: "Станция вагонеток", en: "Cart Station" }, color: 0xc8a03a }, { id: "vault", name: { ru: "Хранилище самоцветов", en: "Gem Vault" }, color: 0xc84aff }] },
    { id: "sky", name: { ru: "Небесные острова", en: "Sky Isles" }, ready: true, sky: 0xbfe0ff, ground: 0xffffff,
      unlock: { builds: 6, coins: 65000 },
      buildings: [{ id: "windmill", name: { ru: "Ветряная мельница", en: "Windmill" }, color: 0xf4f4f4 }, { id: "dock", name: { ru: "Причал дирижаблей", en: "Airship Dock" }, color: 0xffc83a }, { id: "garden", name: { ru: "Облачный сад", en: "Cloud Garden" }, color: 0x7ad87a }, { id: "bell", name: { ru: "Небесная звонница", en: "Sky Bell Tower" }, color: 0xe8c070 }, { id: "balloons", name: { ru: "Башня шаров", en: "Balloon Tower" }, color: 0xff5a5a }] },
    { id: "moon", name: { ru: "Лунный парк", en: "Moon Park" }, ready: true, sky: 0x4a3f8f, ground: 0x8a8a90,
      unlock: { builds: 6, coins: 90000 },
      buildings: [{ id: "dome", name: { ru: "Жилой купол", en: "Dome House" }, color: 0xbfe8ff }, { id: "pad", name: { ru: "Стартовая площадка", en: "Rocket Pad" }, color: 0xe84a3a }, { id: "mooncarousel", name: { ru: "Лунная карусель", en: "Moon Carousel" }, color: 0xff8ad8 }, { id: "dish", name: { ru: "Антенна", en: "Radio Dish" }, color: 0xe8e8ec }, { id: "cafe", name: { ru: "Кафе в кратере", en: "Crater Cafe" }, color: 0x3affd0 }] }
  ];
  /* стоимость построек в слитках: [здание][уровень] */
  var BUILD_COST = [[3, 8, 15], [4, 9, 16], [4, 10, 17], [5, 11, 19], [5, 12, 20]];
  var BUILD_WORLD_MUL = 0.3;    // в каждом следующем мире стройка дороже на 30 % от базовой (Луна ×3,1)
  var BUILD_BONUS = 0.01;      // +1 % монет за каждый уровень постройки
  var BUILD_BONUS_MAX = 0.4;   // не больше +40 %

  /* ---- Костюмы (29). look — образ для 3D: top/sleeve/pants/shoe/hair/glove, kinds — материалы, hat — головной убор,
     acc — детали ("имя" или "имя:цвет"), trail — цвет следа. perk — бонус (только у части бесплатных).
     get: start | coins(n) | task(stat, n) | world(w) | days(n) | ads(n) | buy(p) ---- */
  function S(id, ru, en, look, trail, get, perk) {
    var c = { cap: look.hatC != null ? look.hatC : look.top, top: look.top, pants: look.pants, shoe: look.shoe };
    return { id: id, name: { ru: ru, en: en }, look: look, c: c, trail: trail, get: get, perk: perk || null };
  }
  var SKINS = [
    S("courier", "Курьерша", "Courier", { top: 0xff7a2e, pants: 0x2b3442, shoe: 0xf4f4f4, hat: "cap", hatC: 0xffc61a, acc: ["bag"], kinds: { top: "leather" } }, 0xffc61a, { t: "start" }),
    S("sporty", "Спортивная", "Sporty", { top: 0x1fbf9a, pants: 0x15181f, shoe: 0xff3d7f, sole: 0xffffff, hat: "band", hatC: 0xff3d7f, kinds: { pants: "rubber" } }, 0x1fbf9a, { t: "coins", n: 1500 }),
    S("street", "Уличная", "Street", { top: 0x6a3fd0, pants: 0x5a5a5e, shoe: 0x111111, sole: 0xeeeeee, hat: "beanie", hatC: 0x1a1a1e, acc: ["skate:c8402a"] }, 0xa07aff, { t: "coins", n: 3000 }, { shoes: 2 }),
    S("chef", "Шеф", "Chef", { top: 0xf4f4f0, pants: 0x1e1e22, shoe: 0x1e1e22, hat: "toque", acc: ["apron:1e1e22"], forearm: 0xf2c6a0 }, 0xffffff, { t: "coins", n: 5000 }),
    S("fire", "Пожарная", "Firefighter", { top: 0xb8261e, pants: 0xb8261e, shoe: 0x1a1a1a, glove: 0x2a2a2a, hat: "firehelmet", hatC: 0xc8302a, acc: ["vest:ffd21a"], kinds: { top: "rubber", pants: "rubber" } }, 0xff8a2e, { t: "coins", n: 7500 }, { shield: 5 }),
    S("captain", "Капитан", "Captain", { top: 0x1c2a4a, pants: 0xf2f2f0, shoe: 0x1a1210, hat: "captain", hatC: 0x1c2a4a, acc: ["belt:111111"] }, 0x7ab8ff, { t: "coins", n: 10000 }),
    S("ninja", "Ниндзя", "Ninja", { top: 0x1a1e2e, pants: 0x1a1e2e, shoe: 0x111111, glove: 0x1a1e2e, hat: "ninja", hatC: 0x1a1e2e, acc: ["sash:c8202a"], hideHair: true }, 0x6a6aff, { t: "coins", n: 13000 }, { stumble: 1 }),
    S("astro", "Космонавт", "Astronaut", { top: 0xeeeeee, pants: 0xe2e2e2, shoe: 0x9a9a9a, glove: 0xdadada, hat: "astro", acc: ["lifepack"], kinds: { top: "plastic", pants: "plastic" } }, 0x8fe3ff, { t: "coins", n: 17000 }, { jet: 2 }),
    S("knight", "Рыцарь", "Knight", { top: 0x2a4a9a, sleeve: 0xb8c0c8, pants: 0xa8b0b8, shoe: 0x707880, glove: 0x9aa2aa, hat: "knight", acc: ["armor:c0c8d0", "belt:5a3a1e"], kinds: { sleeve: "metal", pants: "metal", shoe: "metal" } }, 0xd9e6f2, { t: "coins", n: 21000 }, { startShield: 1 }),
    S("heroine", "Супергероиня", "Heroine", { top: 0x2456c8, pants: 0x2456c8, shoe: 0xc8202a, glove: 0xc8202a, hat: "eyemask", acc: ["cape:c8202a", "belt:ffc61a"], kinds: { top: "plastic", pants: "plastic" } }, 0xffe23a, { t: "coins", n: 26000 }, { magnet: 3 }),
    S("ranger", "Рейнджер", "Ranger", { top: 0xa83a2a, pants: 0x2f4a7a, shoe: 0x5a341a, hat: "ranger", hatC: 0x7a4a26, acc: ["vest:8a6a4a", "belt:3a2414"] }, 0xd9a35a, { t: "coins", n: 32000 }, { coins: 0.05 }),
    S("explorer", "Путешественница", "Explorer", { top: 0x6e7a3a, pants: 0xb8a070, shoe: 0x5a3a1e, shin: 0xf2c6a0, shinKind: "skin", hat: "safari", hatC: 0xd8c68e, acc: ["bag:6a4a2a"] }, 0xd9c28a, { t: "task", stat: "runs", n: 10 }),
    S("sprinter", "Спринтер", "Sprinter", { top: 0xe8e8e8, pants: 0xd82a3a, shoe: 0x6aff3a, shin: 0xf2c6a0, shinKind: "skin", forearm: 0xf2c6a0, sleeve: 0xf2c6a0, hat: "band", hatC: 0xd82a3a, acc: ["bib"], kinds: { sleeve: "skin" } }, 0xff3a5a, { t: "task", stat: "best", n: 5000 }),
    S("detective", "Сыщица", "Detective", { top: 0x5a5a62, pants: 0x2a2a30, shoe: 0x2a1a10, hat: "flatcap", hatC: 0x6a5a48, acc: ["trench:b89a6a", "scarf:7a2a2a"] }, 0xc8b08a, { t: "task", stat: "coinsAll", n: 10000 }, { bars: 0.15 }),
    S("builder", "Строитель", "Builder", { top: 0x3a5a9a, pants: 0x3a5a9a, shoe: 0x5a3a1e, glove: 0xd8a03a, hat: "hardhat", hatC: 0xffc21a, acc: ["vest:ff7a1a", "belt:5a3a1e"] }, 0xffc21a, { t: "task", stat: "builds", n: 10 }, { build: 0.1 }),
    S("freerunner", "Паркур", "Freerunner", { top: 0x2f5a3a, pants: 0x2a2a2e, shoe: 0x8a8a8a, glove: 0x111111, hat: "hood", hatC: 0x2f5a3a, acc: ["backpack:1e1e22"] }, 0x5aff9a, { t: "task", stat: "caught", n: 5 }, { chase: 0.15 }),
    S("nomad", "Кочевница", "Desert Nomad", { top: 0xe08a2a, pants: 0xeee0c4, shoe: 0x8a5a2e, hat: "wrap", hatC: 0xf0e4c8, acc: ["robe:e08a2a", "sash:c8302a"] }, 0xf2c46b, { t: "world", w: "dunes" }),
    S("skier", "Лыжница", "Skier", { top: 0xf2f6fa, pants: 0x7ab8e8, shoe: 0x2a5aa8, glove: 0x2a5aa8, hat: "skihelmet", hatC: 0x2a5aa8, kinds: { top: "plastic" } }, 0xffffff, { t: "world", w: "snow" }),
    S("alpinist", "Альпинистка", "Alpinist", { top: 0xd8303a, pants: 0x2a2a3a, shoe: 0x6a4a2a, glove: 0x2a2a3a, hat: "pompom", hatC: 0xf2f2f2, acc: ["backpack:3a5a3a", "belt:ffb21a"], kinds: { top: "plastic" } }, 0xff9ab0, { t: "days", n: 7 }),
    S("dj", "Диджей", "DJ", { top: 0x7a2ad8, pants: 0x18a89a, shoe: 0xffffff, hat: "headphones", hatC: 0xff3d9a, acc: ["lines:ff3d9a"], kinds: { top: "leather" }, topEx: { emissive: 0x2a0a4a, ei: 0.4 } }, 0xff5fa2, { t: "days", n: 14 }),
    S("queen", "Королева", "Queen", { top: 0x5a1a8a, pants: 0x5a1a8a, shoe: 0xffc61a, hat: "crown", acc: ["cape:8a1a2a", "belt:ffc61a", "skirt:5a1a8a"] }, 0xffd23a, { t: "days", n: 30 }),
    S("cyborg", "Киборг", "Cyborg", { top: 0xd8dce2, sleeve: 0x7a828c, pants: 0x5a626c, shoe: 0x3a424c, glove: 0x7a828c, hat: "visor", hatC: 0x3affff, acc: ["lines:3affff"], kinds: { sleeve: "metal", top: "plastic", pants: "metal" } }, 0x3affff, { t: "ads", n: 5 }),
    S("racer", "Гонщица", "Racer", { top: 0xd82020, pants: 0xd82020, shoe: 0x111111, glove: 0x111111, hat: "racer", acc: ["belt:f2f2f2", "vest:f2f2f2"], kinds: { top: "plastic" } }, 0xff5a3a, { t: "ads", n: 10 }),
    S("hockey", "Хоккеистка", "Hockey", { top: 0xffc21a, pants: 0x111111, shoe: 0x222222, glove: 0x111111, sole: 0xc8d0d8, hat: "hockey", hatC: 0x111111, acc: ["stick"] }, 0xffe25a, { t: "ads", n: 15 }),
    S("golden", "Золотая легенда", "Golden Legend", { top: 0xe8b830, pants: 0x1a1a1a, shoe: 0xe8b830, hat: "cap", hatC: 0xe8b830, acc: ["goldglow:ffd24a", "lines:ffd24a"], kinds: { top: "gold", shoe: "gold" } }, 0xffe25a, { t: "buy", p: "skin_golden" }),
    S("neon", "Неон", "Neon", { top: 0x15151c, pants: 0x15151c, shoe: 0x15151c, sole: 0x2affd9, glove: 0x15151c, hat: "visor", hatC: 0xff2ad9, acc: ["lines:2affd9"] }, 0x2affd9, { t: "buy", p: "skin_neon" }),
    S("dragon", "Драконья броня", "Dragon Armor", { top: 0x9a1a14, sleeve: 0x9a1a14, pants: 0x6a120e, shoe: 0x3a0a08, glove: 0x3a0a08, hat: "horns", hatC: 0x9a1a14, acc: ["armor:b8281e", "dwings:7a1410", "lines:ff7a1a"], kinds: { top: "metal", sleeve: "metal", pants: "metal" } }, 0xff7a1a, { t: "buy", p: "skin_dragon" }),
    S("wizard", "Чародейка", "Sorceress", { top: 0x22205a, pants: 0x22205a, shoe: 0x111122, hat: "sorchood", hatC: 0x2a2870, acc: ["robe:2a2870", "sash:c0c8ff", "staff:9a7aff"] }, 0xb08aff, { t: "buy", p: "skin_wizard" }),
    S("lanternist", "Фонарщица", "Lantern Keeper", { top: 0xc8302a, pants: 0x2a1a14, shoe: 0x3a2a1a, hat: "wrap", hatC: 0xffc23a, acc: ["sash:ffc23a", "robe:c8302a", "staff:ff9a3a"] }, 0xff8a3a, { t: "season", s: "lanterns" }),
    S("frost", "Морозная", "Frost", { top: 0xdff4ff, sleeve: 0xa8dcff, pants: 0x6aaedc, shoe: 0xffffff, glove: 0xa8dcff, hat: "crown", acc: ["cape:bfe8ff", "lines:9fe0ff"], kinds: { top: "ice" } }, 0xbfe8ff, { t: "season", s: "frost" }),
    S("corsair", "Корсарка", "Corsair", { top: 0xf2ece0, pants: 0x2a2a3a, shoe: 0x3a2214, hat: "captain", hatC: 0x6a1a1a, acc: ["sash:c8302a", "belt:3a2214", "trench:6a1a1a"] }, 0xffb8a0, { t: "season", s: "corsair" }),
    S("neonracer", "Неоновая гонщица", "Neon Racer", { top: 0x15151c, pants: 0x15151c, shoe: 0xff3ad9, sole: 0x3affff, glove: 0x15151c, hat: "racer", acc: ["lines:ff3ad9", "vest:2a2a3a"] }, 0xff3ad9, { t: "season", s: "neon" }),
    S("champion", "Чемпионка", "Champion", { top: 0xf4f0e8, sleeve: 0xf4f0e8, pants: 0x1a1a22, shoe: 0xe8b830, glove: 0xe8b830, hat: "crown", acc: ["cape:e8b830", "belt:e8b830", "lines:ffd24a"], kinds: { shoe: "gold", glove: "gold" } }, 0xffe27a, { t: "boss", w: "moon" }, { coins: 0.05 }),
    S("samurai", "Кибер-самурай", "Cyber Samurai", { top: 0xf0f0f2, sleeve: 0x1a1a1e, pants: 0x1a1a1e, shoe: 0xf0f0f2, glove: 0x1a1a1e, hat: "kabuto", acc: ["armor:f0f0f2", "lines:ff2a3a"], kinds: { top: "paint", pants: "plastic" } }, 0xff2a3a, { t: "buy", p: "skin_samurai" })
  ];
  /* ---- Арс — второй герой (напарник Мики): 8 образов. hero: "ars" ---- */
  function AR(id, ru, en, look, trail, get, perk) { var x = S(id, ru, en, Object.assign({ male: true, skinTone: 0xd8a47a, hair: 0x2a1a12 }, look), trail, get, perk); x.hero = "ars"; return x; }
  var ARS = [
    AR("ars", "Арс-изобретатель", "Ars the Inventor", { top: 0x1f8a9a, pants: 0x22262e, shoe: 0xf2f2f2, sole: 0x2affd9, hat: "goggles", hatC: 0xc8862a, acc: ["backpack:6a4a2a", "belt:3a2a1a"] }, 0x2affd9, { t: "hero" }),
    AR("ars_street", "Арс с района", "Street Ars", { top: 0xc8302a, pants: 0x6a6a5a, shoe: 0x111111, hat: "flatcap", hatC: 0x2a2a2a, acc: ["skate:2a6ad8"] }, 0xff5a3a, { t: "coins", n: 3000 }),
    AR("ars_hacker", "Хакер", "Hacker", { top: 0x15151c, pants: 0x15151c, shoe: 0x2a2a2a, hat: "hood", hatC: 0x15151c, acc: ["lines:3aff6a"] }, 0x3aff6a, { t: "coins", n: 8000 }),
    AR("ars_pilot", "Пилот", "Pilot", { top: 0x7a4a26, pants: 0x3a3a2a, shoe: 0x2a1a10, hat: "aviator", hatC: 0x5a3a1e, acc: ["scarf:f2f2f2", "belt:2a1a10"], kinds: { top: "leather" } }, 0xd9c28a, { t: "coins", n: 14000 }),
    AR("ars_astro", "Арс-космонавт", "Astro Ars", { top: 0xeeeeee, pants: 0xe2e2e2, shoe: 0x9a9a9a, glove: 0xdadada, hat: "astro", acc: ["lifepack"], kinds: { top: "plastic", pants: "plastic" } }, 0x8fe3ff, { t: "coins", n: 22000 }),
    AR("ars_knight", "Страж", "Guardian", { top: 0x8a1a1a, sleeve: 0xb8c0c8, pants: 0xa8b0b8, shoe: 0x707880, glove: 0x9aa2aa, hat: "knight", acc: ["armor:c0c8d0", "cape:8a1a1a"], kinds: { sleeve: "metal", pants: "metal", shoe: "metal" } }, 0xd9e6f2, { t: "task", stat: "bossWins", n: 2 }),
    AR("ars_ninja", "Тень", "Shadow", { top: 0x22222a, pants: 0x22222a, shoe: 0x111111, glove: 0x22222a, hat: "ninja", hatC: 0x22222a, acc: ["sash:2a6ad8"], hideHair: true }, 0x6a8aff, { t: "days", n: 20 }),
    AR("ars_cyber", "Кибер-рыцарь", "Cyber Knight", { top: 0xf0f0f2, sleeve: 0xe8b830, pants: 0x1a1a1e, shoe: 0xe8b830, glove: 0xe8b830, hat: "visor", hatC: 0x3affff, acc: ["armor:e8b830", "lines:3affff"], kinds: { sleeve: "gold", shoe: "gold" } }, 0x3affff, { t: "buy", p: "skin_ars_cyber" })
  ];
  SKINS.forEach(function (x) { if (!x.hero) x.hero = "mika"; });
  SKINS = SKINS.concat(ARS);
  /* герои: бонус постоянный, складывается с бонусом образа */
  var HEROES = [
    { id: "mika", name: { ru: "Мика", en: "Mika" }, base: "courier", perk: { chase: 0.1 }, get: { t: "start" } },
    { id: "ars", name: { ru: "Арс", en: "Ars" }, base: "ars", perk: { bars: 0.1 }, get: { t: "unlock", coins: 20000, boss: 1 } }
  ];
  /* Товары Яндекса (создаёт владелец в консоли; цены здесь — запасные, на экране — из getCatalog) */
  var PRODUCTS = {
    skin_golden: { skins: ["golden"], price: 99 },
    skin_neon: { skins: ["neon"], price: 79 },
    skin_dragon: { skins: ["dragon"], price: 149 },
    skin_wizard: { skins: ["wizard"], price: 79 },
    skin_samurai: { skins: ["samurai"], price: 119 },
    skin_ars_cyber: { skins: ["ars_cyber"], price: 99 },
    pack_all: { skins: ["golden", "neon", "dragon", "wizard", "samurai"], price: 349 }
  };

  /* ---- Бусты: длительность по уровню улучшения (0..5), цена улучшения ---- */
  var BOOSTS = {
    magnet: { dur: [8, 10, 12, 15, 17, 20], color: 0xff3a5a },
    x2: { dur: [10, 12, 14, 17, 19, 22], color: 0x2ed1a0 },
    shield: { dur: [20, 23, 26, 29, 32, 35], color: 0x5ab4ff },
    jet: { dur: [6, 7, 8, 9, 10, 12], color: 0xff9a1a },
    shoes: { dur: [10, 12, 14, 16, 18, 20], color: 0xb05aff }
  };
  var BOOST_ORDER = ["magnet", "x2", "shield", "jet", "shoes"];
  var UPGRADE_COST = [800, 2000, 4500, 9000, 16000];
  /* стартовые бусты на один забег (покупаются за монеты перед стартом) и ключи за монеты */
  var START_BOOSTS = { shield: 400, x2: 700, jet: 1200 };
  var KEY_PRICE = 2500, KEYS_PER_DAY = 2;

  /* ---- Задания дня (3 случайных) ---- */
  var TASKS = [
    { id: "coins", goal: [300, 500, 800], reward: 200 },
    { id: "dist", goal: [1000, 1500, 2500], reward: 250 },
    { id: "boosts", goal: [3, 5, 8], reward: 200 },
    { id: "jumps", goal: [20, 40, 60], reward: 150 },
    { id: "slides", goal: [15, 30, 45], reward: 150 },
    { id: "bars", goal: [2, 4, 6], reward: 250 },
    { id: "caught", goal: [1, 2, 3], reward: 300 },
    { id: "runs", goal: [3, 5, 8], reward: 150 }
  ];
  var LETTERS = { ru: "ЗОЛОТО", en: "GOLDEN" };
  /* ---- Задания недели (копятся 7 дней; награда — слитки и ключи, все пять — большой сундук) ---- */
  var WEEKLY = [
    { id: "wdist", goal: 25000, reward: { bars: 4 } },
    { id: "wcoins", goal: 6000, reward: { bars: 4 } },
    { id: "wcaught", goal: 8, reward: { keys: 2 } },
    { id: "wbuilds", goal: 4, reward: { coins: 2000 } },
    { id: "wworlds", goal: 3, reward: { keys: 1, bars: 2 } }
  ];
  /* ---- Событие выходных (сб и вс по серверной дате): слитки чаще, поимка Шмыга даёт больше ---- */
  var WEEKEND = { bars: 0.5, catchBonus: 1 };
  /* ---- Финальные погони: открываются после 10 построек в мире. target — метры, throwGap — пауза между бросками ловушек (с).
     Первая победа — награда reward; повтор — 2 слитка раз в день. ---- */
  var BOSS = { needBuilds: 10, replayBars: 2, list: {
    town: { target: 1000, throwGap: 3.6, reward: { bars: 10 } },
    dunes: { target: 1150, throwGap: 3.4, reward: { bars: 15 } },
    snow: { target: 1300, throwGap: 3.2, reward: { bars: 20, keys: 1 } },
    jungle: { target: 1450, throwGap: 3.0, reward: { pet: "robodog", bars: 10 } },
    harbor: { target: 1600, throwGap: 2.9, reward: { bars: 30, keys: 1 } },
    mine: { target: 1750, throwGap: 2.8, reward: { bars: 35, keys: 2 } },
    sky: { target: 1900, throwGap: 2.7, reward: { bars: 40, keys: 2 } },
    moon: { target: 2100, throwGap: 2.5, reward: { skin: "champion", bars: 50 } }
  } };
  /* ---- Сезонные события: по 14 дней по кругу (по серверной дате). Своя валюта на трассе, оформление, 10 наград, последняя — образ.
     Пропустил — событие вернётся через 8 недель. ---- */
  var SEASONS = { days: 14, epoch: 20400, tokenChance: 0.06, catchTokens: 10,
    tiers: [40, 100, 180, 280, 400, 550, 720, 900, 1100, 1350],
    rewards: [{ coins: 500 }, { bars: 2 }, { keys: 1 }, { coins: 1500 }, { chest: "small" }, { bars: 4 }, { keys: 2 }, { coins: 3000 }, { chest: "big" }, { skin: true }],
    list: [
      { id: "lanterns", name: { ru: "Фестиваль фонарей", en: "Lantern Festival" }, token: { ru: "фонарики", en: "lanterns" }, color: 0xff6a3a, skin: "lanternist", deco: "lanterns" },
      { id: "frost", name: { ru: "Морозный карнавал", en: "Frost Carnival" }, token: { ru: "снежинки", en: "snowflakes" }, color: 0x9fe0ff, skin: "frost", deco: "snow" },
      { id: "corsair", name: { ru: "Неделя корсаров", en: "Corsair Weeks" }, token: { ru: "ракушки", en: "seashells" }, color: 0xffb8a0, skin: "corsair", deco: "flags" },
      { id: "neon", name: { ru: "Неоновая ночь", en: "Neon Night" }, token: { ru: "звёздочки", en: "stars" }, color: 0xff3ad9, skin: "neonracer", deco: "neon" }
    ] };
  /* ---- Достижения (34): stat — счётчик из сохранения или вычисляемый (worlds, skins, pets, bosses, builds), n — цель, r — награда ---- */
  function A(id, stat, n, r, ru, en) { return { id: id, stat: stat, n: n, r: r, name: { ru: ru, en: en } }; }
  var ACHIEVEMENTS = [
    A("run1", "runs", 10, { coins: 300 }, "Первые шаги", "First steps"), A("run2", "runs", 50, { coins: 1000 }, "Бегунья", "Runner"), A("run3", "runs", 200, { bars: 5 }, "Марафонец", "Marathoner"), A("run4", "runs", 500, { bars: 10 }, "Неутомимая", "Tireless"),
    A("best1", "best", 1000, { coins: 500 }, "Километр", "One kilometer"), A("best2", "best", 3000, { bars: 2 }, "Три километра", "Three kilometers"), A("best3", "best", 6000, { bars: 4 }, "Шесть километров", "Six kilometers"), A("best4", "best", 10000, { bars: 8 }, "Десять километров!", "Ten kilometers!"),
    A("coin1", "coinsAll", 10000, { coins: 1000 }, "Копилка", "Piggy bank"), A("coin2", "coinsAll", 100000, { bars: 5 }, "Сундучок", "Treasure box"), A("coin3", "coinsAll", 500000, { bars: 15 }, "Золотая гора", "Gold mountain"),
    A("catch1", "caught", 1, { coins: 300 }, "Попался!", "Gotcha!"), A("catch2", "caught", 10, { bars: 2 }, "Охотница", "Hunter"), A("catch3", "caught", 50, { bars: 6 }, "Гроза енотов", "Raccoon's nightmare"),
    A("build1", "builds", 5, { coins: 800 }, "Строитель", "Builder"), A("build2", "builds", 20, { bars: 3 }, "Архитектор", "Architect"), A("build3", "builds", 60, { bars: 8 }, "Градостроитель", "City planner"), A("build4", "builds", 120, { bars: 20 }, "Все города отстроены", "All towns rebuilt"),
    A("world1", "worlds", 2, { coins: 1000 }, "Путешественница", "Traveler"), A("world2", "worlds", 4, { bars: 4 }, "Полсвета", "Half the world"), A("world3", "worlds", 8, { bars: 10 }, "До самой Луны", "All the way to the Moon"),
    A("skin1", "skins", 5, { coins: 1000 }, "Модница", "Fashionista"), A("skin2", "skins", 15, { bars: 4 }, "Гардероб", "Wardrobe"), A("skin3", "skins", 30, { bars: 10 }, "Коллекционер образов", "Outfit collector"),
    A("pet1", "pets", 1, { coins: 500 }, "Лучший друг", "Best friend"), A("pet2", "pets", 4, { bars: 3 }, "Стая", "The pack"), A("pet3", "pets", 8, { bars: 8 }, "Весь зверинец", "Full menagerie"),
    A("boss1", "bosses", 1, { bars: 3 }, "Финал!", "Finale!"), A("boss2", "bosses", 4, { bars: 6 }, "Четыре погони", "Four chases"), A("boss3", "bosses", 8, { bars: 15 }, "Шмыг повержен", "Shmyg defeated"),
    A("bars1", "barsAll", 100, { coins: 2000 }, "Слиток за слитком", "Bar by bar"), A("boost1", "boostsAll", 100, { coins: 1500 }, "Ускорение", "Power-ups"),
    A("days1", "days", 7, { bars: 2 }, "Неделя в игре", "One week"), A("days2", "days", 30, { bars: 6 }, "Месяц в игре", "One month"),
    A("jump1", "jumpsAll", 1000, { coins: 1500 }, "Прыгунья", "Jumper"), A("token1", "tokensAll", 500, { bars: 3 }, "Праздник!", "Party time!")
  ];
  /* ---- Мини-игры: раз в день бесплатно + раз за ролик. Среднее колеса ≈200 монет + 0,26 слитка + 0,12 ключа + сундук 10 %. ---- */
  var WHEEL = [
    { r: { coins: 100 }, w: 20, c: 0x3a6ad8 }, { r: { coins: 250 }, w: 18, c: 0x8a4ad8 }, { r: { bars: 1 }, w: 14, c: 0xe8a020 }, { r: { coins: 500 }, w: 14, c: 0x2aa86a },
    { r: { keys: 1 }, w: 12, c: 0xc8402a }, { r: { coins: 1000 }, w: 6, c: 0xd8306a }, { r: { chest: "small" }, w: 10, c: 0x2a9ab8 }, { r: { bars: 2 }, w: 6, c: 0xf2c21a }
  ];
  var SHELL = { win: { bars: 1 }, lose: { coins: 100 }, swaps: 7 };
  var LEADERBOARD = "best";   // имя таблицы лидеров в консоли Яндекса (создаёт владелец), очки — метры за забег

  /* ---- Календарь входа (по кругу) и сундуки ---- */
  var CALENDAR = [{ bars: 3 }, { coins: 300 }, { keys: 1 }, { coins: 500 }, { bars: 3 }, { coins: 800 }, { chest: "big" }];
  /* сундук: монеты от–до, шанс ключа, шанс и число слитков — показываются игроку как есть */
  var CHESTS = {
    small: { coins: [300, 800], key: 0.3, bar: 0.2, bars: [1, 1] },
    big: { coins: [1000, 2500], key: 1, bar: 1, bars: [1, 3] }
  };
  var FREE_CHEST_MS = 4 * 3600 * 1000;

  /* ---- Забег ---- */
  var RUN = {
    lane: 2.2, speed0: 12, speedMax: 28, speedTau: 110,
    gravity: 34, jumpV: 11.5, shoesJumpV: 16, slideT: 0.7,
    stumbleWindow: 10, continueKeyCost: 1,
    catchCoins: 0.22, catchBar: 8, catchBoost: 4, stumbleCatch: -30, catchReward: 2
  };

  return { WORLDS: WORLDS, BUILD_COST: BUILD_COST, BUILD_BONUS: BUILD_BONUS, BUILD_BONUS_MAX: BUILD_BONUS_MAX,
    SKINS: SKINS, PRODUCTS: PRODUCTS, BOOSTS: BOOSTS, BOOST_ORDER: BOOST_ORDER, UPGRADE_COST: UPGRADE_COST, START_BOOSTS: START_BOOSTS, KEY_PRICE: KEY_PRICE, KEYS_PER_DAY: KEYS_PER_DAY, BUILD_WORLD_MUL: BUILD_WORLD_MUL,
    WHEEL: WHEEL, SHELL: SHELL, HEROES: HEROES, BOSS: BOSS, SEASONS: SEASONS, ACHIEVEMENTS: ACHIEVEMENTS, TASKS: TASKS, LETTERS: LETTERS, WEEKLY: WEEKLY, WEEKEND: WEEKEND, LEADERBOARD: LEADERBOARD, CALENDAR: CALENDAR, CHESTS: CHESTS, FREE_CHEST_MS: FREE_CHEST_MS, RUN: RUN };
})();
