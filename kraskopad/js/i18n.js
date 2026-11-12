/* Краскопад · тексты RU / EN. KP.t(key, a, b) — подстановка {0}, {1}. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var D = {
    ru: {
      title: "Краскопад", subtitle: "тактический пейнтбол · королевская битва",
      play: "Играть", solo: "Соло · 25 бойцов", trio: "Трио · 8 команд", tutor: "Обучение", music: "Музыка", tutStep: "Обучение · шаг {0} из {1}", tutDone: "Обучение пройдено! +100 опыта",
      tut1: "Идите: клавиши WASD", tut1t: "Идите: левый стик (левая половина экрана)",
      tut2: "Осмотритесь: двигайте мышью", tut2t: "Осмотритесь: ведите пальцем по правой половине экрана",
      tut3: "Подберите оружие впереди: подойдите к нему (или нажмите E)", tut3t: "Подберите оружие впереди: подойдите к нему",
      tut4: "Стреляйте по мишени: ЛКМ, прицел — ПКМ", tut4t: "Стреляйте по мишени: кнопка «Огонь», её можно вести пальцем",
      tut5: "Добудьте 10 досок: выберите топор (1) и рубите дерево ЛКМ", tut5t: "Добудьте 10 досок: выберите топор (слот 1) и рубите дерево кнопкой «Огонь»",
      tut6: "Постройте стену (Q) и рампу (F)", tut6t: "Постройте стену и рампу: кнопки «Стена» и «Рампа»",
      tut7: "Вылечитесь: H", tut7t: "Вылечитесь: кнопка «Аптечка»",
      tut8: "Бросьте гранату: G (B — сменить вид)", tut8t: "Бросьте гранату: кнопка «Граната»",
      tut9: "Сядьте на квадроцикл неподалёку: E", tut9t: "Сядьте на квадроцикл неподалёку: кнопка «Сесть»", train: "Тренировка", event: "Событие дня", trainHud: "Тренировка · выход через паузу",
      ev0: "Ближний бой", ev0d: "только дробовики и пистолеты", ev1: "Снайперская дуэль", ev1d: "только дальнобой и пистолеты", ev2: "Гранатный ливень", ev2d: "гранаты повсюду",
      ev3: "Лёгкая гравитация", ev3d: "прыжки выше, падение медленнее", ev4: "Быстрая хмарь", ev4d: "зона сужается быстрее", ev5: "Штурм", ev5d: "автоматы и 150 досок на старте", quick: "Быстрый матч · 12", wardrobe: "Снаряжение", settings: "Настройки", stats: "Статистика",
      back: "Назад", lvl: "Уровень {0}", xp: "{0} / {1} опыта", loading: "Загрузка острова…",
      jump: "Прыжок", jumpHint: "Нажмите «Прыжок» или Пробел, когда дирижабль над нужной точкой",
      fire: "Огонь", jumpBtn: "Прыжок", wall: "Стена", ramp: "Рампа", heal: "Аптечка", reload: "Перезар.", take: "Взять",
      alive: "В игре: {0}", kos: "Выбито: {0}", wood: "Доски", chest: "Открыть ящик снабжения",
      zoneWait: "Хмарь сужается через {0}", zoneMove: "Хмарь сужается · {0}", zoneFinal: "Финальная зона",
      outside: "Вы в Серой хмари — двигайтесь к центру", noWood: "Не хватает досок", healing: "Лечение…", reloading: "Перезарядка",
      win: "Победа", lose: "Выбит", place: "Место {0} из {1}",
      resKos: "Выбито соперников", resDmg: "Нанесено урона", resTime: "Время в матче", resXp: "Опыт",
      again: "Новый матч", menu: "В лобби", x2: "×2 опыта за просмотр ролика", x2prem: "×2 опыта (Премиум)", premium: "★ Премиум", x2done: "Опыт удвоен", newLvl: "Новый уровень: {0}", unlocked: "Открыто: {0}",
      ko: "{0} выбил {1}", koZone: "{0} — потерян в хмари", youKo: "Выбит: {0}", byWho: "Вас выбил {0}",
      pause: "Пауза", resume: "Продолжить", leave: "Покинуть матч", sens: "Чувствительность", sound: "Звук", on: "вкл", off: "выкл",
      quality: "Графика", qLow: "производительность", qHigh: "качество (тени)", lang: "Язык", rotate: "Поверните телефон горизонтально",
      lockLvl: "Уровень {0}", lockCh: "Задание: {0}", chWin: "победа в матче", chKo5: "5 выбитых за матч", selected: "Выбрано", choose: "Выбрать",
      skins: "Бойцы", paints: "Цвет краски",
      stM: "Матчей", stW: "Побед", stKo: "Выбито всего", stBest: "Лучшее место", stKmax: "Рекорд выбитых", stDmg: "Урон всего",
      pcHelp: "WASD — движение · мышь — обзор · ЛКМ — огонь · ПКМ — прицел · Пробел — прыжок · Q — стена · F — рампа · E — взять / сесть · R — перезарядка · H — аптечка · G — бросить гранату · B — сменить гранату · 1–5 — оружие",
      tutorial: "Соберите оружие, рубите деревья топором на доски, ставьте стены (Q) и рампы (F). Последний в игре — победитель.",
      clickToPlay: "Щёлкните, чтобы управлять мышью",
      w0: "Топор", w1: "Искра", w2: "Шквал", w3: "Ливень", w4: "Штрих-7", w5: "Горизонт", w6: "Залп",
      i_tube: "Инъектор", i_pal: "Аптечка", i_lac: "Щит", i_big: "Большой щит", i_gren: "Граната", i_smoke: "Дым", i_pop: "Мгновенная стена", noGren: "Нет гранат", enterV: "Сесть на квадроцикл", exitV: "Выйти", gren: "Граната",
      r0: "обычное", r1: "редкое", r2: "эпическое", r3: "легендарное",
      poi0: "Старый порт", poi1: "Нижний город", poi2: "Тихий лес", poi3: "Пик Ветров", poi4: "Фабрика красок", poi5: "Лагерь рейнджеров", poi6: "Пальмовый пляж", poi7: "Ферма у реки", poi8: "Маяк", poi9: "Плотина",
      sk0: "Рекрут", sk1: "Рекрутка", sk2: "Рысь", sk3: "Сокол", sk4: "Вега", sk5: "Шторм", sk6: "Коралл", sk7: "Лесник", sk8: "Механик", sk9: "Ночной", sk10: "Пустыня", sk11: "Арктика", sk12: "Неон", sk13: "Байкер", sk14: "Капитан",
      sk15: "Медик", sk16: "Сапёр", sk17: "Лиса", sk18: "Призрак", sk19: "Тайфун", sk20: "Тех-ронин", sk21: "Джунгли", sk22: "Пилот", sk23: "Хакер", sk24: "Золото", sk25: "Вулкан", sk26: "Прибой", sk27: "Агент", sk28: "Призма", sk29: "Чемпион",
      em0: "Привет", em1: "Честь", em2: "Танец", em3: "Смех", em4: "Сила", em5: "Отдых", em6: "Вихрь",
      wr0: "Заводская", wr1: "Неон", wr2: "Камуфляж", wr3: "Арктика", wr4: "Лава", wr5: "Океан", wr6: "Золото", wr7: "Призма", wr8: "Карбон",
      ch_win: "победа в матче", ch_ko5: "5 выбитых за матч", ch_win10: "10 побед", lockPass: "Пропуск, ступень {0}", lockPrem: "Премиум · ступень {0} или уровень {1}",
      emote: "Эмоция", emotes: "Эмоции", wrap: "Раскраска", wraps: "Раскраски", pass: "Боевой пропуск", quests: "Задания", daily: "Задания дня", weekly: "Задания недели",
      tier: "Пропуск: ступень {0} из {1}", season: "Сезон 1 · Цвет шторма", passHow: "{0} очков = ступень; очки = опыт за матчи и задания", premOn: "Премиум активен — открыта вторая ветка", premOff: "вторая ветка — Премиум (или уровень, указан у награды)",
      newTier: "Пропуск: ступень {0}", questDone: "Задание выполнено: {0}", questsDone: "Задания: {0} из {1}",
      q_ko: "Выбейте {0} соперников", q_dmg: "Нанесите {0} урона", q_built: "Постройте {0} стен или рамп", q_chests: "Откройте {0} ящиков снабжения", q_top10: "Попадите в десятку {0} раз", q_top5: "Попадите в пятёрку {0} раз",
      q_play: "Сыграйте {0} матчей", q_thrown: "Бросьте {0} гранат", q_driven: "Проедьте {0} м на квадроцикле", q_heals: "Вылечитесь {0} раз", q_wins: "Победите {0} раз",
      unitM: "м", unitMin: "мин", stT5: "В пятёрке", stBuilt: "Построено", stChests: "Ящиков открыто", stDrv: "Проехано", stTime: "Время в матчах",
      pc0: "Маджента", pc1: "Лазурь", pc2: "Лайм", pc3: "Оранж", pc4: "Фиолет", pc5: "Бирюза", pc6: "Золото", pc7: "Призма"
    },
    en: {
      title: "Paintdrop Island", subtitle: "tactical paintball · battle royale",
      play: "Play", solo: "Solo · 25 players", trio: "Trios · 8 squads", tutor: "Tutorial", music: "Music", tutStep: "Tutorial · step {0} of {1}", tutDone: "Tutorial complete! +100 XP",
      tut1: "Move: WASD keys", tut1t: "Move: left stick (left half of the screen)",
      tut2: "Look around: move the mouse", tut2t: "Look around: drag on the right half of the screen",
      tut3: "Pick up the weapon ahead: walk over it (or press E)", tut3t: "Pick up the weapon ahead: walk over it",
      tut4: "Shoot a target: LMB, aim — RMB", tut4t: "Shoot a target: the Fire button (you can drag it to aim)",
      tut5: "Get 10 planks: select the axe (1) and chop a tree with LMB", tut5t: "Get 10 planks: select the axe (slot 1) and chop a tree with Fire",
      tut6: "Build a wall (Q) and a ramp (F)", tut6t: "Build a wall and a ramp: Wall and Ramp buttons",
      tut7: "Heal: H", tut7t: "Heal: the Medkit button",
      tut8: "Throw a grenade: G (B — switch type)", tut8t: "Throw a grenade: the Grenade button",
      tut9: "Get on the nearby ATV: E", tut9t: "Get on the nearby ATV: the Ride button", train: "Training", event: "Daily event", trainHud: "Training · leave via pause",
      ev0: "Close quarters", ev0d: "shotguns and pistols only", ev1: "Sniper duel", ev1d: "long-range markers and pistols only", ev2: "Grenade rain", ev2d: "grenades everywhere",
      ev3: "Low gravity", ev3d: "higher jumps, slower falls", ev4: "Fast fog", ev4d: "the zone closes faster", ev5: "Assault", ev5d: "rifles and 150 planks at start", quick: "Quick match · 12", wardrobe: "Loadout", settings: "Settings", stats: "Stats",
      back: "Back", lvl: "Level {0}", xp: "{0} / {1} XP", loading: "Loading the island…",
      jump: "Jump", jumpHint: "Press “Jump” or Space when the airship is over your spot",
      fire: "Fire", jumpBtn: "Jump", wall: "Wall", ramp: "Ramp", heal: "Medkit", reload: "Reload", take: "Take",
      alive: "Alive: {0}", kos: "Knockouts: {0}", wood: "Planks", chest: "Open supply crate",
      zoneWait: "Grey Fog closes in {0}", zoneMove: "Grey Fog closing · {0}", zoneFinal: "Final zone",
      outside: "You're in the Grey Fog — move to the center", noWood: "Not enough planks", healing: "Healing…", reloading: "Reloading",
      win: "Victory", lose: "Knocked out", place: "Place {0} of {1}",
      resKos: "Knockouts", resDmg: "Damage dealt", resTime: "Time in match", resXp: "XP",
      again: "New match", menu: "Lobby", x2: "×2 XP for watching a video", x2prem: "×2 XP (Premium)", premium: "★ Premium", x2done: "XP doubled", newLvl: "New level: {0}", unlocked: "Unlocked: {0}",
      ko: "{0} knocked out {1}", koZone: "{0} — lost in the fog", youKo: "Knocked out: {0}", byWho: "Knocked out by {0}",
      pause: "Paused", resume: "Resume", leave: "Leave match", sens: "Sensitivity", sound: "Sound", on: "on", off: "off",
      quality: "Graphics", qLow: "performance", qHigh: "quality (shadows)", lang: "Language", rotate: "Turn your phone sideways",
      lockLvl: "Level {0}", lockCh: "Challenge: {0}", chWin: "win a match", chKo5: "5 knockouts in a match", selected: "Selected", choose: "Choose",
      skins: "Fighters", paints: "Paint color",
      stM: "Matches", stW: "Wins", stKo: "Total knockouts", stBest: "Best place", stKmax: "Most knockouts", stDmg: "Total damage",
      pcHelp: "WASD — move · mouse — look · LMB — fire · RMB — aim · Space — jump · Q — wall · F — ramp · E — take / ride · R — reload · H — medkit · G — throw grenade · B — switch grenade · 1–5 — weapons",
      tutorial: "Grab weapons, chop trees with the axe for planks, build walls (Q) and ramps (F). Last one standing wins.",
      clickToPlay: "Click to control with the mouse",
      w0: "Axe", w1: "Spark", w2: "Squall", w3: "Downpour", w4: "Stroke-7", w5: "Horizon", w6: "Volley",
      i_tube: "Injector", i_pal: "Medkit", i_lac: "Shield", i_big: "Big shield", i_gren: "Grenade", i_smoke: "Smoke", i_pop: "Pop wall", noGren: "No grenades", enterV: "Ride the ATV", exitV: "Get off", gren: "Grenade",
      r0: "common", r1: "rare", r2: "epic", r3: "legendary",
      poi0: "Old Port", poi1: "Downtown", poi2: "Quiet Woods", poi3: "Windy Peak", poi4: "Paint Factory", poi5: "Ranger Camp", poi6: "Palm Beach", poi7: "River Farm", poi8: "Lighthouse", poi9: "The Dam",
      sk0: "Recruit", sk1: "Rookie", sk2: "Lynx", sk3: "Falcon", sk4: "Vega", sk5: "Storm", sk6: "Coral", sk7: "Ranger", sk8: "Mechanic", sk9: "Nightwatch", sk10: "Dune", sk11: "Arctic", sk12: "Neon", sk13: "Rider", sk14: "Captain",
      sk15: "Medic", sk16: "Engineer", sk17: "Fox", sk18: "Phantom", sk19: "Typhoon", sk20: "Tech Ronin", sk21: "Jungle", sk22: "Pilot", sk23: "Hacker", sk24: "Gold Rush", sk25: "Volcano", sk26: "Surf", sk27: "Agent", sk28: "Prism", sk29: "Champion",
      em0: "Hello", em1: "Salute", em2: "Dance", em3: "Laugh", em4: "Flex", em5: "Chill", em6: "Whirl",
      wr0: "Factory", wr1: "Neon", wr2: "Camo", wr3: "Arctic", wr4: "Lava", wr5: "Ocean", wr6: "Gold", wr7: "Prism", wr8: "Carbon",
      ch_win: "win a match", ch_ko5: "5 knockouts in a match", ch_win10: "10 wins", lockPass: "Pass tier {0}", lockPrem: "Premium · tier {0} or level {1}",
      emote: "Emote", emotes: "Emotes", wrap: "Wrap", wraps: "Wraps", pass: "Battle pass", quests: "Challenges", daily: "Daily challenges", weekly: "Weekly challenges",
      tier: "Pass: tier {0} of {1}", season: "Season 1 · Storm Colors", passHow: "{0} points = a tier; points = XP from matches and challenges", premOn: "Premium active — second track open", premOff: "second track — Premium (or the level shown on the reward)",
      newTier: "Pass: tier {0}", questDone: "Challenge complete: {0}", questsDone: "Challenges: {0} of {1}",
      q_ko: "Knock out {0} rivals", q_dmg: "Deal {0} damage", q_built: "Build {0} walls or ramps", q_chests: "Open {0} supply crates", q_top10: "Finish top 10 {0} times", q_top5: "Finish top 5 {0} times",
      q_play: "Play {0} matches", q_thrown: "Throw {0} grenades", q_driven: "Ride {0} m on an ATV", q_heals: "Heal {0} times", q_wins: "Win {0} times",
      unitM: "m", unitMin: "min", stT5: "Top 5", stBuilt: "Built", stChests: "Crates opened", stDrv: "Distance ridden", stTime: "Time in matches",
      pc0: "Magenta", pc1: "Azure", pc2: "Lime", pc3: "Orange", pc4: "Violet", pc5: "Teal", pc6: "Gold", pc7: "Prism"
    }
  };
  var NAMES = {
    ru: ["Рысь", "Сокол", "Вега", "Шторм", "Кобра", "Барс", "Гром", "Тень", "Ястреб", "Орион", "Скиф", "Нова", "Ворон", "Дюна", "Кедр", "Фантом", "Бриз", "Титан", "Комета", "Гейзер", "Сапсан", "Пульс", "Ангара", "Вектор", "Полярис", "Рубин", "Хаски", "Зенит"],
    en: ["Lynx", "Falcon", "Vega", "Storm", "Cobra", "Panther", "Thunder", "Shade", "Hawk", "Orion", "Nomad", "Nova", "Raven", "Dune", "Cedar", "Phantom", "Breeze", "Titan", "Comet", "Geyser", "Peregrine", "Pulse", "Rapids", "Vector", "Polaris", "Ruby", "Husky", "Zenith"]
  };
  KP.lang = "ru";
  KP.t = function (k, a, b) {
    var s = (D[KP.lang] && D[KP.lang][k]) || D.ru[k] || k;
    if (a !== undefined) s = s.replace("{0}", a);
    if (b !== undefined) s = s.replace("{1}", b);
    return s;
  };
  KP.botNames = function () { return NAMES[KP.lang] || NAMES.ru; };
})(window.KP);
